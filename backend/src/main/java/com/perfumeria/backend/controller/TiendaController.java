package com.perfumeria.backend.controller;

import com.perfumeria.backend.service.TiendaService;
import com.perfumeria.backend.service.ConfirmacionPedidoEmailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Rutas públicas para el cliente de la tienda (no requieren ser administrador).
 */
@RestController
@RequestMapping("/api/tienda")
public class TiendaController {

    private final TiendaService tiendaService;
    private final ConfirmacionPedidoEmailService confirmacionEmail;

    public TiendaController(TiendaService tiendaService, ConfirmacionPedidoEmailService confirmacionEmail) {
        this.tiendaService = tiendaService;
        this.confirmacionEmail = confirmacionEmail;
    }

    @PostMapping("/pedidos")
    public ResponseEntity<Map<String, Object>> crearPedido(@RequestBody TiendaService.PedidoRequest pedido) {
        Map<String, Object> creado = tiendaService.crearPedido(pedido);
        creado.put("correoEnviado", confirmacionEmail.enviarConfirmacionCliente(
                pedido.cliente().email(), pedido.cliente().dniRuc(), creado));
        creado.put("notificacionTiendaEnviada", confirmacionEmail.enviarAvisoTienda(
                pedido.cliente().dniRuc(), creado, pedido.cliente()));
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
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
}
