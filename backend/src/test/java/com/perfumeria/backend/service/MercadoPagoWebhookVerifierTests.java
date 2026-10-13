package com.perfumeria.backend.service;

import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MercadoPagoWebhookVerifierTests {

    @Test
    void aceptaFirmaValidaDeMercadoPago() throws Exception {
        String secreto = "secreto-de-prueba";
        String paymentId = "123456";
        String requestId = "request-abc";
        String timestamp = "1700000000";
        String manifiesto = "id:" + paymentId
                + ";request-id:" + requestId
                + ";ts:" + timestamp
                + ";";

        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secreto.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String firma = "ts=" + timestamp + ",v1=" + HexFormat.of().formatHex(
                mac.doFinal(manifiesto.getBytes(StandardCharsets.UTF_8)));

        assertTrue(MercadoPagoWebhookVerifier.verificar(secreto, paymentId, requestId, firma));
    }

    @Test
    void rechazaFirmaModificadaYOpcionesIncompletas() {
        assertFalse(MercadoPagoWebhookVerifier.verificar(
                "secreto", "123456", "request-abc", "ts=1700000000,v1=incorrecta"));
        assertFalse(MercadoPagoWebhookVerifier.verificar(
                "secreto", "123456", "request-abc", "v1=incorrecta"));
    }
}
