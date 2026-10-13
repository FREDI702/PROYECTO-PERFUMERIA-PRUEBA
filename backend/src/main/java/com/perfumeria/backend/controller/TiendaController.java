package com.perfumeria.backend.controller;

import com.perfumeria.backend.service.TiendaService;
import com.perfumeria.backend.service.TiendaCheckoutService;
import com.perfumeria.backend.service.ConfirmacionPedidoEmailService;
import com.perfumeria.backend.service.MercadoPagoService;
import tools.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Rutas públicas para el cliente de la tienda (no requieren ser administrador).
 */
@RestController
@RequestMapping("/api/tienda")
public class TiendaController {

    private final TiendaService tiendaService;
    private final TiendaCheckoutService checkoutService;
    private final ConfirmacionPedidoEmailService confirmacionEmail;
    private final MercadoPagoService mercadoPagoService;

    public TiendaController(
            TiendaService tiendaService,
            TiendaCheckoutService checkoutService,
            ConfirmacionPedidoEmailService confirmacionEmail,
            MercadoPagoService mercadoPagoService) {
        this.tiendaService = tiendaService;
        this.checkoutService = checkoutService;
        this.confirmacionEmail = confirmacionEmail;
        this.mercadoPagoService = mercadoPagoService;
    }

    @PostMapping("/pedidos")
    public ResponseEntity<Map<String, Object>> crearPedido(@RequestBody TiendaService.PedidoRequest pedido) {
        Map<String, Object> creado = checkoutService.crearPedido(pedido);
        creado.put("correoEnviado", confirmacionEmail.enviarConfirmacionCliente(
                pedido.cliente().email(), pedido.cliente().dniRuc(), creado));
        creado.put("notificacionTiendaEnviada", confirmacionEmail.enviarAvisoTienda(
                pedido.cliente().dniRuc(), creado, pedido.cliente()));
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PostMapping("/mercadopago/webhook")
    public ResponseEntity<Void> notificacionMercadoPago(
            @RequestParam Map<String, String> parametros,
            @RequestHeader(name = "x-signature", required = false) String firma,
            @RequestHeader(name = "x-request-id", required = false) String requestId,
            @RequestBody(required = false) JsonNode cuerpo) {
        String tipo = parametros.getOrDefault("type", parametros.getOrDefault("topic", ""));
        if (!"payment".equalsIgnoreCase(tipo)
                && (cuerpo == null || !"payment".equalsIgnoreCase(cuerpo.path("type").asText()))) {
            return ResponseEntity.ok().build();
        }

        String paymentId = parametros.getOrDefault("data.id", parametros.get("id"));
        if ((paymentId == null || paymentId.isBlank()) && cuerpo != null) {
            paymentId = cuerpo.path("data").path("id").asText("");
        }
        if (paymentId == null || paymentId.isBlank()
                || !mercadoPagoService.verificarFirma(paymentId, requestId, firma)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        JsonNode pago = mercadoPagoService.consultarPago(paymentId);
        if (pago == null || !"approved".equalsIgnoreCase(pago.path("status").asText())
                || !"PEN".equalsIgnoreCase(pago.path("currency_id").asText())) {
            return ResponseEntity.ok().build();
        }

        try {
            Long idVenta = Long.valueOf(pago.path("external_reference").asText());
            BigDecimal monto = new BigDecimal(pago.path("transaction_amount").asText());
            tiendaService.confirmarPagoTarjeta(idVenta, monto);
        } catch (NumberFormatException e) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/pedidos/{idVenta}")
    public ResponseEntity<Map<String, Object>> consultar(@PathVariable Long idVenta,
                                                         @RequestParam String dni) {
        Map<String, Object> pedido = tiendaService.consultar(idVenta, dni);
        if (pedido == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("mensaje", "No encontramos un pedido con ese número y documento"));
        }
        return ResponseEntity.ok(pedido);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> datosInvalidos(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("mensaje", e.getMessage()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> errorDeServicio(ResponseStatusException e) {
        String mensaje = e.getReason() == null ? "No se pudo procesar la solicitud." : e.getReason();
        return ResponseEntity.status(e.getStatusCode()).body(Map.of("mensaje", mensaje));
    }
}
