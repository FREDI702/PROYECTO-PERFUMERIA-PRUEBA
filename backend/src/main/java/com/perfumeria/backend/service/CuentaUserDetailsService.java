package com.perfumeria.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class CuentaUserDetailsService implements UserDetailsService {

    private final JdbcTemplate jdbcTemplate;
    private final String adminUsername;
    private final String adminPasswordHash;
    private final String usuarioUsername;
    private final String usuarioPasswordHash;

    public CuentaUserDetailsService(
            JdbcTemplate jdbcTemplate,
            @Value("${ADMIN_USERNAME:}") String adminUsername,
            @Value("${ADMIN_PASSWORD:}") String adminPassword,
            @Value("${USER_USERNAME:}") String usuarioUsername,
            @Value("${USER_PASSWORD:}") String usuarioPassword,
            PasswordEncoder passwordEncoder) {
        this.jdbcTemplate = jdbcTemplate;
        this.adminUsername = adminUsername;
        this.adminPasswordHash = passwordEncoder.encode(adminPassword);
        this.usuarioUsername = usuarioUsername;
        this.usuarioPasswordHash = passwordEncoder.encode(usuarioPassword);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        String normalizado = normalizar(username);
        if (normalizado.equals(normalizar(adminUsername))) {
            return User.withUsername(adminUsername)
                    .password(adminPasswordHash)
                    .roles("ADMIN")
                    .build();
        }
        if (normalizado.equals(normalizar(usuarioUsername))) {
            return User.withUsername(usuarioUsername)
                    .password(usuarioPasswordHash)
                    .roles("USUARIO")
                    .build();
        }

        UserDetails usuarioGuardado = jdbcTemplate.query(
                """
                SELECT username, password_hash
                FROM public.app_users
                WHERE LOWER(username) = ? OR LOWER(email) = ?
                """,
                result -> {
                    if (!result.next()) return null;
                    return User.withUsername(result.getString("username"))
                            .password(result.getString("password_hash"))
                            .roles("USUARIO")
                            .build();
                },
                normalizado,
                normalizado
        );
        if (usuarioGuardado == null) {
            throw new UsernameNotFoundException("Cuenta no encontrada.");
        }
        return usuarioGuardado;
    }

    private String normalizar(String username) {
        return username.trim().toLowerCase(Locale.ROOT);
    }
}
