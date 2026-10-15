package com.perfumeria.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;
import java.util.TreeMap;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class CloudinaryImageService {

    private static final Pattern PUBLIC_ID_PATTERN = Pattern.compile("perfume-[1-9][0-9]{0,18}");

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;

    public CloudinaryImageService(
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret) {
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    public PublicConfiguration publicConfiguration() {
        return new PublicConfiguration(cloudName);
    }

    public UploadSignature signUpload(String publicId) {
        if (publicId == null || !PUBLIC_ID_PATTERN.matcher(publicId).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El identificador de imagen no es válido.");
        }
        if (cloudName.isBlank() || apiKey.isBlank() || apiSecret.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "La carga de imágenes no está configurada en el servidor.");
        }

        long timestamp = Instant.now().getEpochSecond();
        Map<String, String> parameters = new TreeMap<>();
        parameters.put("overwrite", "true");
        parameters.put("public_id", publicId);
        parameters.put("timestamp", Long.toString(timestamp));
        String canonicalParameters = parameters.entrySet().stream()
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .collect(Collectors.joining("&"));

        return new UploadSignature(
                cloudName,
                apiKey,
                timestamp,
                sha1(canonicalParameters + apiSecret),
                publicId,
                true);
    }

    private String sha1(String value) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-1").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("No se pudo generar la firma de carga de imágenes.", exception);
        }
    }

    public record PublicConfiguration(String cloudName) {}

    public record UploadSignature(
            String cloudName,
            String apiKey,
            long timestamp,
            String signature,
            String publicId,
            boolean overwrite) {}
}
