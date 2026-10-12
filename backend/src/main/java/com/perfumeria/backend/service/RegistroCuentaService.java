package com.perfumeria.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

@Service
public class RegistroCuentaService {

    private static final Pattern USUARIO_VALIDO = Pattern.compile("[a-zA-Z0-9._-]{3,32}");
    private static final Pattern CORREO_VALIDO =
            Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final String adminUsername;
    private final String usuarioReservado;

    public RegistroCuentaService(
            JdbcTemplate jdbcTemplate,
            PasswordEncoder passwordEncoder,
            @Value("${ADMIN_USERNAME:}") String adminUsername,
            @Value("${USER_USERNAME:}") String usuarioReservado) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.adminUsername = adminUsername;
        this.usuarioReservado = usuarioReservado;
    }

    public String registrar(String username, String email, String password, String confirmation) {
        if (username == null || !USUARIO_VALIDO.matcher(username).matches()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El usuario debe tener entre 3 y 32 caracteres: letras, números, punto, guion o guion bajo.");
        }
        if (email == null || email.length() > 254 || !CORREO_VALIDO.matcher(email).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ingresa un correo electrónico válido.");
        }
        if (password == null || password.length() < 12
                || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La contraseña debe tener al menos 12 caracteres y no superar 72 bytes UTF-8.");
        }
        if (!password.equals(confirmation)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Las contraseñas no coinciden.");
        }

        String normalizado = username.toLowerCase(Locale.ROOT);
        String correoNormalizado = email.trim().toLowerCase(Locale.ROOT);
        if (normalizado.equals(adminUsername.toLowerCase(Locale.ROOT))
                || normalizado.equals(usuarioReservado.toLowerCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ese nombre de usuario está reservado.");
        }

        try {
            jdbcTemplate.update(
                    "INSERT INTO public.app_users (username, email, password_hash) VALUES (?, ?, ?)",
                    normalizado,
                    correoNormalizado,
                    passwordEncoder.encode(password)
            );
        } catch (DuplicateKeyException error) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ese usuario o correo electrónico ya está registrado.",
                    error
            );
        }
        return normalizado;
    }
}
