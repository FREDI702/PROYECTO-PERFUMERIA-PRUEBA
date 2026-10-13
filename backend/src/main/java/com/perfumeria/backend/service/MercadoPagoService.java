package com.perfumeria.backend.service;

import tools.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.net.URI;

@Service
public class MercadoPagoService {

    private final RestClient client;
    private final String accessToken;
    private final String webhookSecret;
    private final String webhookUrl;
    private final String frontendUrl;

    public MercadoPagoService(
            @Value("${mercadopago.access-token:}") String accessToken,
            @Value("${mercadopago.webhook-secret:}") String webhookSecret,
            @Value("${mercadopago.webhook-url:}") String webhookUrl,
            @Value("${frontend.url}") String frontendUrl) {
        this.client = RestClient.builder().baseUrl("https://api.mercadopago.com").build();
        this.accessToken = accessToken;
        this.webhookSecret = webhookSecret;
        this.webhookUrl = webhookUrl;
        this.frontendUrl = frontendUrl;
    }

    public boolean estaConfigurado() {
        return !accessToken.isBlank() && !webhookSecret.isBlank() && esHttps(webhookUrl);
    }

    public String crearPreferencia(Long idVenta, Map<String, Object> pedido, String correo) {
        validarConfiguracion();

        List<Map<String, Object>> productos = new ArrayList<>();
        Object elementos = pedido.get("items");
        if (elementos instanceof Iterable<?> items) {
            for (Object elemento : items) {
                if (!(elemento instanceof Map<?, ?> item)) {
                    throw new IllegalStateException("No se pudo preparar el detalle del pago.");
                }
                productos.add(Map.of(
                        "id", String.valueOf(item.get("idPerfume")),
                        "title", String.valueOf(item.get("nombre")),
                        "quantity", ((Number) item.get("cantidad")).intValue(),
                        "currency_id", "PEN",
                        "unit_price", new BigDecimal(String.valueOf(item.get("precioUnitario")))
                ));
            }
        }
        if (productos.isEmpty()) {
            throw new IllegalStateException("No se encontraron productos para el pago.");
        }

        String referencia = "mp_result";
        String retorno = frontendUrl.replaceAll("/+$", "");
        Map<String, Object> solicitud = new LinkedHashMap<>();
        solicitud.put("items", productos);
        solicitud.put("payer", Map.of("email", correo.trim()));
        solicitud.put("external_reference", String.valueOf(idVenta));
        solicitud.put("notification_url", webhookUrl);
        solicitud.put("back_urls", Map.of(
                "success", retorno + "/?"+ referencia + "=approved&order=" + idVenta,
                "pending", retorno + "/?"+ referencia + "=pending&order=" + idVenta,
                "failure", retorno + "/?"+ referencia + "=failure&order=" + idVenta
        ));
        solicitud.put("auto_return", "approved");
        solicitud.put("statement_descriptor", "PERFUMERIA NECTAR");
        solicitud.put("payment_methods", Map.of(
                "excluded_payment_types", List.of(
                        Map.of("id", "ticket"),
                        Map.of("id", "bank_transfer"),
                        Map.of("id", "atm"),
                        Map.of("id", "account_money"),
                        Map.of("id", "digital_wallet")
                )
        ));

        try {
            JsonNode respuesta = client.post()
                    .uri("/checkout/preferences")
                    .header("Authorization", "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(solicitud)
                    .retrieve()
                    .body(JsonNode.class);
            if (respuesta == null) {
                throw new IllegalStateException("Mercado Pago devolvió una respuesta vacía.");
            }
            String campoEnlace = accessToken.startsWith("TEST-") ? "sandbox_init_point" : "init_point";
            String enlace = respuesta.path(campoEnlace).asText("");
            if (!esUrlMercadoPago(enlace)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Mercado Pago no devolvió un enlace de pago seguro.");
            }
            return enlace;
        } catch (RestClientException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "No se pudo iniciar el pago con Mercado Pago. No se registró la compra; inténtalo otra vez.",
                    e);
        }
    }

    public JsonNode consultarPago(String paymentId) {
        validarConfiguracion();
        try {
            return client.get()
                    .uri("/v1/payments/{id}", paymentId)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY, "No se pudo verificar el pago con Mercado Pago.", e);
        }
    }

    public boolean verificarFirma(String paymentId, String requestId, String signature) {
        if (webhookSecret.isBlank() || paymentId == null || requestId == null || signature == null) {
            return false;
        }
        return MercadoPagoWebhookVerifier.verificar(webhookSecret, paymentId, requestId, signature);
    }

    private void validarConfiguracion() {
        if (!estaConfigurado()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Falta configurar Mercado Pago en el backend.");
        }
    }

    private static boolean esHttps(String url) {
        return url != null && url.startsWith("https://");
    }

    private static boolean esUrlMercadoPago(String url) {
        try {
            URI uri = URI.create(url);
            String host = uri.getHost();
            return "https".equalsIgnoreCase(uri.getScheme())
                    && host != null
                    && (host.equals("mercadopago.com")
                    || host.endsWith(".mercadopago.com")
                    || host.equals("mercadopago.com.pe")
                    || host.endsWith(".mercadopago.com.pe"));
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
