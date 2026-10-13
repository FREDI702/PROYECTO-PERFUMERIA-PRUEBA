package com.perfumeria.backend.service;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.PreparedStatement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Lógica de la tienda: crea el pedido completo (cliente, venta, detalle, envío)
 * en una sola transacción. El precio SIEMPRE se lee de la base de datos, nunca
 * del navegador.
 */
@Service
public class TiendaService {

    // ---- Tablas (deben coincidir con el esquema de cada @Table de los modelos) ----
    private static final String T_CLIENTE = "public.cliente";
    private static final String T_PERFUME = "public.perfume";
    private static final String T_VENTA = "public.venta";
    private static final String T_DETALLE = "a_perfumeria.detalle_venta";
    private static final String T_PEDIDO = "a_perfumeria.pedido_envio";

    private static final Set<String> PAGOS = Set.of("yape", "plin", "tarjeta", "efectivo");
    private static final Set<String> COMPROBANTES = Set.of("boleta", "factura");

    private final JdbcTemplate jdbc;

    public TiendaService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ---------- Datos que llegan del navegador ----------
    public record ClienteDatos(String nombre, String apellido, String dniRuc,
                               String telefono, String email, String direccion) {
    }

    public record ItemPedido(Long idPerfume, Integer cantidad) {
    }

    public record PedidoRequest(ClienteDatos cliente, String metodoPago,
                                String tipoComprobante, List<ItemPedido> items) {
    }

    // ---------- Crear pedido ----------
    @Transactional
    public Map<String, Object> crearPedido(PedidoRequest pedido) {
        if (pedido == null || pedido.cliente() == null) {
            throw new IllegalArgumentException("Faltan los datos del cliente");
        }
        ClienteDatos c = pedido.cliente();
        String nombre = limpiar(c.nombre());
        String apellido = limpiar(c.apellido());
        String dni = limpiar(c.dniRuc());
        String telefono = limpiar(c.telefono());
        String email = limpiar(c.email());
        String direccion = limpiar(c.direccion());

        if (nombre.isEmpty() || apellido.isEmpty()) {
            throw new IllegalArgumentException("Ingresa tu nombre y apellido");
        }
        if (!dni.matches("\\d{8}|\\d{11}")) {
            throw new IllegalArgumentException("El DNI debe tener 8 dígitos (o RUC de 11)");
        }
        if (!telefono.matches("\\d{7,15}")) {
            throw new IllegalArgumentException("Ingresa un teléfono válido (solo números)");
        }
        if (direccion.length() < 5) {
            throw new IllegalArgumentException("Ingresa tu dirección de entrega");
        }
        if (email.length() > 254 || !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new IllegalArgumentException("Ingresa un correo válido para recibir la confirmación del pedido");
        }

        String pago = limpiar(pedido.metodoPago()).toLowerCase();
        String comprobante = limpiar(pedido.tipoComprobante()).toLowerCase();
        if (!PAGOS.contains(pago)) {
            throw new IllegalArgumentException("Método de pago no válido");
        }
        if (!COMPROBANTES.contains(comprobante)) {
            throw new IllegalArgumentException("Tipo de comprobante no válido");
        }
        if (comprobante.equals("factura") && dni.length() != 11) {
            throw new IllegalArgumentException("Para factura necesitas un RUC de 11 dígitos");
        }

        if (pedido.items() == null || pedido.items().isEmpty()) {
            throw new IllegalArgumentException("Tu carrito está vacío");
        }

        // Unir líneas repetidas del mismo perfume
        Map<Long, Integer> cantidades = new LinkedHashMap<>();
        for (ItemPedido item : pedido.items()) {
            if (item == null || item.idPerfume() == null || item.cantidad() == null
                    || item.cantidad() < 1 || item.cantidad() > 20) {
                throw new IllegalArgumentException("Cantidad no válida (entre 1 y 20 por perfume)");
            }
            cantidades.merge(item.idPerfume(), item.cantidad(), Integer::sum);
        }

        // Leer precios reales y descontar stock de forma atómica
        List<Map<String, Object>> lineas = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (Map.Entry<Long, Integer> e : cantidades.entrySet()) {
            Map<String, Object> perfume;
            try {
                perfume = jdbc.queryForMap(
                        "SELECT nombre, precio FROM " + T_PERFUME + " WHERE id_perfume = ?", e.getKey());
            } catch (EmptyResultDataAccessException ex) {
                throw new IllegalArgumentException("Uno de los perfumes ya no existe");
            }
            String nombrePerfume = (String) perfume.get("nombre");
            BigDecimal precio = (BigDecimal) perfume.get("precio");

            int filas = jdbc.update(
                    "UPDATE " + T_PERFUME + " SET stock = stock - ? WHERE id_perfume = ? AND stock >= ?",
                    e.getValue(), e.getKey(), e.getValue());
            if (filas != 1) {
                throw new IllegalArgumentException("No hay stock suficiente de " + nombrePerfume);
            }

            BigDecimal subtotal = precio.multiply(BigDecimal.valueOf(e.getValue()));
            total = total.add(subtotal);

            Map<String, Object> linea = new LinkedHashMap<>();
            linea.put("idPerfume", e.getKey());
            linea.put("nombre", nombrePerfume);
            linea.put("cantidad", e.getValue());
            linea.put("precioUnitario", precio);
            linea.put("subtotal", subtotal);
            lineas.add(linea);
        }

        // Cliente: se reutiliza si el DNI/RUC ya existe (sin modificar sus datos)
        List<Long> existentes = jdbc.queryForList(
                "SELECT id_cliente FROM " + T_CLIENTE + " WHERE dni_ruc = ?", Long.class, dni);
        Long idCliente;
        if (existentes.isEmpty()) {
            idCliente = insertarYObtenerId(
                    "INSERT INTO " + T_CLIENTE + " (nombre, apellido, dni_ruc, telefono, email, direccion) "
                            + "VALUES (?, ?, ?, ?, ?, ?)",
                    "id_cliente", nombre, apellido, dni, telefono, email.isEmpty() ? null : email, direccion);
        } else {
            idCliente = existentes.get(0);
        }

        Long idVenta = insertarYObtenerId(
                "INSERT INTO " + T_VENTA + " (id_cliente, metodo_pago, tipo_comprobante, monto_total, estado_venta) "
                        + "VALUES (?, ?, ?, ?, 'pendiente')",
                "id_venta", idCliente, pago, comprobante, total);

        for (Map<String, Object> l : lineas) {
            jdbc.update(
                    "INSERT INTO " + T_DETALLE + " (id_venta, id_perfume, cantidad, precio_unitario, descuento) "
                            + "VALUES (?, ?, ?, ?, 0)",
                    idVenta, l.get("idPerfume"), l.get("cantidad"), l.get("precioUnitario"));
        }

        Long idPedido = insertarYObtenerId(
                "INSERT INTO " + T_PEDIDO + " (id_venta, fecha_pedido, estado_envio) "
                        + "VALUES (?, CURRENT_DATE, 'PENDIENTE')",
                "id_pedido", idVenta);

        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("idVenta", idVenta);
        respuesta.put("idPedido", idPedido);
        respuesta.put("cliente", nombre + " " + apellido);
        respuesta.put("metodoPago", pago);
        respuesta.put("tipoComprobante", comprobante);
        respuesta.put("estadoEnvio", "PENDIENTE");
        respuesta.put("total", total);
        respuesta.put("items", lineas);
        return respuesta;
    }

    @Transactional
    public boolean confirmarPagoTarjeta(Long idVenta, BigDecimal monto) {
        if (idVenta == null || monto == null || monto.signum() <= 0) {
            return false;
        }
        List<Map<String, Object>> ventas = jdbc.queryForList(
                "SELECT monto_total, estado_venta FROM " + T_VENTA
                        + " WHERE id_venta = ? AND LOWER(metodo_pago) = 'tarjeta'",
                idVenta);
        if (ventas.isEmpty()) {
            return false;
        }

        Map<String, Object> venta = ventas.get(0);
        BigDecimal totalRegistrado = new BigDecimal(String.valueOf(venta.get("monto_total")))
                .setScale(2, RoundingMode.HALF_UP);
        if (totalRegistrado.compareTo(monto.setScale(2, RoundingMode.HALF_UP)) != 0) {
            return false;
        }
        if ("completada".equalsIgnoreCase(String.valueOf(venta.get("estado_venta")))) {
            return true;
        }
        return jdbc.update(
                "UPDATE " + T_VENTA + " SET estado_venta = 'Completada' "
                        + "WHERE id_venta = ? AND LOWER(estado_venta) = 'pendiente'",
                idVenta) == 1;
    }

    // ---------- Seguimiento (número de orden + DNI/RUC) ----------
    public Map<String, Object> consultar(Long idVenta, String dni) {
        List<Map<String, Object>> filas = jdbc.queryForList(
                "SELECT v.id_venta, v.fecha_hora, v.monto_total, v.metodo_pago, v.tipo_comprobante, v.estado_venta, "
                        + "c.nombre, c.apellido, pe.id_pedido, pe.estado_envio, pe.fecha_entrega "
                        + "FROM " + T_VENTA + " v "
                        + "JOIN " + T_CLIENTE + " c ON c.id_cliente = v.id_cliente "
                        + "LEFT JOIN " + T_PEDIDO + " pe ON pe.id_venta = v.id_venta "
                        + "WHERE v.id_venta = ? AND c.dni_ruc = ?",
                idVenta, limpiar(dni));
        if (filas.isEmpty()) {
            return null;
        }
        Map<String, Object> f = filas.get(0);

        List<Map<String, Object>> items = jdbc.queryForList(
                "SELECT p.nombre, d.cantidad, d.precio_unitario AS \"precioUnitario\", d.subtotal "
                        + "FROM " + T_DETALLE + " d JOIN " + T_PERFUME + " p ON p.id_perfume = d.id_perfume "
                        + "WHERE d.id_venta = ? ORDER BY d.id_detalle",
                idVenta);

        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("idVenta", f.get("id_venta"));
        respuesta.put("idPedido", f.get("id_pedido"));
        respuesta.put("cliente", f.get("nombre") + " " + f.get("apellido"));
        respuesta.put("fecha", String.valueOf(f.get("fecha_hora")));
        respuesta.put("metodoPago", f.get("metodo_pago"));
        respuesta.put("tipoComprobante", f.get("tipo_comprobante"));
        respuesta.put("estadoVenta", f.get("estado_venta"));
        respuesta.put("estadoEnvio", f.get("estado_envio") == null ? "PENDIENTE" : f.get("estado_envio"));
        respuesta.put("fechaEntrega", f.get("fecha_entrega") == null ? null : String.valueOf(f.get("fecha_entrega")));
        respuesta.put("total", f.get("monto_total"));
        respuesta.put("items", items);
        return respuesta;
    }

    private static String limpiar(String texto) {
        return texto == null ? "" : texto.trim();
    }

    private Long insertarYObtenerId(String sql, String columnaId, Object... valores) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(sql, new String[]{columnaId});
            for (int i = 0; i < valores.length; i++) {
                statement.setObject(i + 1, valores[i]);
            }
            return statement;
        }, keyHolder);

        Number id = keyHolder.getKey();
        if (id == null) {
            throw new IllegalStateException("La base no devolvió el identificador generado para " + columnaId);
        }
        return id.longValue();
    }
}
