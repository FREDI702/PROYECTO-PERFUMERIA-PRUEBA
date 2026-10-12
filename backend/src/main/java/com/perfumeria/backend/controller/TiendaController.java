package com.perfumeria.backend.controller;

import com.perfumeria.backend.service.TiendaService;
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

    public TiendaController(TiendaService tiendaService) {
        this.tiendaService = tiendaService;
    }

    @PostMapping("/pedidos")
    public ResponseEntity<Map<String, Object>> crearPedido(@RequestBody TiendaService.PedidoRequest pedido) {
        Map<String, Object> creado = tiendaService.crearPedido(pedido);
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
