package com.perfumeria.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class ConfirmacionPedidoEmailService {

    private static final Logger log = LoggerFactory.getLogger(ConfirmacionPedidoEmailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String remitente;
    private final String correoTienda;

    public ConfirmacionPedidoEmailService(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${app.mail.from:}") String remitente,
            @Value("${app.mail.notification-to:}") String correoTienda) {
        this.mailSenderProvider = mailSenderProvider;
        this.remitente = remitente;
        this.correoTienda = correoTienda;
    }

    public boolean enviarConfirmacionCliente(String destinatario, String dniRuc, Map<String, Object> pedido) {
        return enviar(destinatario, dniRuc, pedido, false);
    }

    public boolean enviarAvisoTienda(String dniRuc, Map<String, Object> pedido, TiendaService.ClienteDatos cliente) {
        if (correoTienda.isBlank()) {
            log.warn("No se envió aviso interno del pedido {}: falta configurar MAIL_NOTIFICATION_TO o MAIL_USERNAME",
                    pedido.get("idVenta"));
            return false;
        }
        if (correoTienda.equalsIgnoreCase(cliente.email().trim())) {
            return true;
        }
        return enviar(correoTienda, dniRuc, pedido, true, cliente);
    }

    private boolean enviar(String destinatario, String dniRuc, Map<String, Object> pedido, boolean avisoTienda) {
        return enviar(destinatario, dniRuc, pedido, avisoTienda, null);
    }

    private boolean enviar(String destinatario, String dniRuc, Map<String, Object> pedido,
                           boolean avisoTienda, TiendaService.ClienteDatos cliente) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null || remitente.isBlank() || destinatario == null || destinatario.isBlank()) {
            log.warn("No se envió {} del pedido {}: falta configurar SMTP y los correos requeridos",
                    avisoTienda ? "aviso interno" : "confirmación al cliente",
                    pedido.get("idVenta"));
            return false;
        }

        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(remitente);
        mensaje.setTo(destinatario);
        mensaje.setSubject((avisoTienda ? "Nueva compra" : "Comprobante de compra")
                + " N.º " + pedido.get("idVenta") + " - Perfumería Néctar");
        String texto;
        if (avisoTienda) {
            texto = """
                    Nueva compra registrada en Perfumería Néctar.

                    Número de orden: %s
                    Código de seguimiento (DNI/RUC): %s
                    Número de envío: %s
                    Cliente: %s
                    Total: S/ %s
                    Método de pago: %s
                    """.formatted(
                    pedido.get("idVenta"),
                    dniRuc.trim(),
                    pedido.get("idPedido"),
                    pedido.get("cliente"),
                    pedido.get("total"),
                    pedido.get("metodoPago"));
        } else {
            texto = """
                    Hola %s:

                    Gracias por comprar en Perfumería Néctar. Aquí tienes el comprobante informativo de tu pedido.
                    Este comprobante no reemplaza una boleta electrónica autorizada por SUNAT.

                    COMPROBANTE DE COMPRA
                    Número de orden: %s
                    Tipo solicitado: %s
                    Código para consultar tu envío (DNI/RUC): %s
                    Número de envío: %s
                    Método de pago: %s

                    """.formatted(
                    pedido.get("cliente"),
                    pedido.get("idVenta"),
                    pedido.get("tipoComprobante"),
                    dniRuc.trim(),
                    pedido.get("idPedido"),
                    pedido.get("metodoPago"));
        }

        if (!avisoTienda) {
            texto += "PRODUCTOS\n";
        } else if (cliente != null) {
            texto += "\n\nDatos del cliente:\nCorreo: %s\nTeléfono: %s\nDirección de entrega: %s\n"
                    .formatted(cliente.email(), cliente.telefono(), cliente.direccion());
        }

        Object itemsObjeto = pedido.get("items");
        if (itemsObjeto instanceof Iterable<?> items) {
            StringBuilder detalle = new StringBuilder();
            for (Object item : items) {
                if (item instanceof Map<?, ?> datos) {
                    if (avisoTienda) {
                        detalle.append("- %s x %s%n".formatted(datos.get("nombre"), datos.get("cantidad")));
                    } else {
                        detalle.append("- %s | Cantidad: %s | Precio unitario: S/ %s | Subtotal: S/ %s%n"
                                .formatted(datos.get("nombre"), datos.get("cantidad"),
                                        datos.get("precioUnitario"), datos.get("subtotal")));
                    }
                }
            }
            if (!detalle.isEmpty()) {
                texto += detalle;
            }
        }
        if (!avisoTienda) {
            texto += """

                    TOTAL: S/ %s

                    Conserva este número de orden y tu DNI/RUC para consultar el estado del envío en la tienda.
                    """.formatted(pedido.get("total"));
        }
        mensaje.setText(texto);

        try {
            mailSender.send(mensaje);
            return true;
        } catch (MailException e) {
            log.error("No se pudo enviar {} del pedido {} ({})",
                    avisoTienda ? "el aviso interno" : "la confirmación al cliente",
                    pedido.get("idVenta"), e.getClass().getSimpleName());
            return false;
        }
    }
}
