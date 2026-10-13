package com.perfumeria.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
public class TiendaCheckoutService {

    private final TiendaService tiendaService;
    private final MercadoPagoService mercadoPagoService;

    public TiendaCheckoutService(TiendaService tiendaService, MercadoPagoService mercadoPagoService) {
        this.tiendaService = tiendaService;
        this.mercadoPagoService = mercadoPagoService;
    }

    @Transactional
    public Map<String, Object> crearPedido(TiendaService.PedidoRequest pedido) {
        boolean pagoConTarjeta = pedido != null
                && "tarjeta".equalsIgnoreCase(pedido.metodoPago() == null ? "" : pedido.metodoPago().trim());
        if (pagoConTarjeta && !mercadoPagoService.estaConfigurado()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "El pago con tarjeta aún no está configurado. Usa Yape o efectivo, o inténtalo más tarde.");
        }

        Map<String, Object> creado = tiendaService.crearPedido(pedido);
        if (pagoConTarjeta) {
            Long idVenta = ((Number) creado.get("idVenta")).longValue();
            creado.put("urlPago", mercadoPagoService.crearPreferencia(
                    idVenta, creado, pedido.cliente().email()));
        }
        return creado;
    }
}
