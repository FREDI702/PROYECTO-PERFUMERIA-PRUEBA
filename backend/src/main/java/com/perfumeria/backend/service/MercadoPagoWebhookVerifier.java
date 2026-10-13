package com.perfumeria.backend.service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.HexFormat;

final class MercadoPagoWebhookVerifier {

    private MercadoPagoWebhookVerifier() {
    }

    static boolean verificar(String secreto, String paymentId, String requestId, String signature) {
        String timestamp = null;
        String firmaRecibida = null;
        for (String parte : signature.split(",")) {
            String[] campo = parte.trim().split("=", 2);
            if (campo.length != 2) {
                continue;
            }
            if (campo[0].equals("ts")) {
                timestamp = campo[1];
            } else if (campo[0].equals("v1")) {
                firmaRecibida = campo[1];
            }
        }
        if (timestamp == null || firmaRecibida == null) {
            return false;
        }

        String manifiesto = "id:" + paymentId.toLowerCase()
                + ";request-id:" + requestId
                + ";ts:" + timestamp
                + ";";
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secreto.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] firmaEsperada = HexFormat.of().formatHex(mac.doFinal(manifiesto.getBytes(StandardCharsets.UTF_8)))
                    .getBytes(StandardCharsets.US_ASCII);
            return MessageDigest.isEqual(
                    firmaEsperada,
                    firmaRecibida.toLowerCase().getBytes(StandardCharsets.US_ASCII));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("No se pudo verificar la firma de Mercado Pago.", e);
        }
    }
}
