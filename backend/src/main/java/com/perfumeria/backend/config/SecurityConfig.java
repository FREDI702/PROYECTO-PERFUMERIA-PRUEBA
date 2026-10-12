package com.perfumeria.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;

import java.nio.charset.StandardCharsets;

@Configuration
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            @Value("${ADMIN_USERNAME:}") String adminUsername,
            @Value("${ADMIN_PASSWORD:}") String adminPassword,
            @Value("${USER_USERNAME:}") String userUsername,
            @Value("${USER_PASSWORD:}") String userPassword) throws Exception {
        validarCredenciales(adminUsername, adminPassword, userUsername, userPassword);
        return http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/registro").permitAll()
                        .requestMatchers("/api/auth/**").hasAnyRole("ADMIN", "USUARIO")
                        .requestMatchers(HttpMethod.GET,
                                "/api/perfumes", "/api/perfumes/**",
                                "/api/marcas", "/api/marcas/**")
                        .hasAnyRole("ADMIN", "USUARIO")
                        .requestMatchers(HttpMethod.POST, "/api/tienda/pedidos")
                        .hasAnyRole("ADMIN", "USUARIO")
                        .requestMatchers(HttpMethod.GET, "/api/tienda/pedidos/**")
                        .hasAnyRole("ADMIN", "USUARIO")
                        .requestMatchers("/api/**").hasRole("ADMIN")
                        .anyRequest().permitAll()
                )
                .httpBasic(basic -> basic.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .build();
    }

    private void validarCredenciales(
            String adminUsername,
            String adminPassword,
            String userUsername,
            String userPassword) {
        if (adminUsername.isBlank() || userUsername.isBlank()
                || adminPassword.length() < 12 || userPassword.length() < 12
                || bytes(adminPassword) > 72 || bytes(userPassword) > 72) {
            throw new IllegalStateException(
                    "Configura ADMIN_USERNAME, ADMIN_PASSWORD, USER_USERNAME y USER_PASSWORD; "
                            + "los nombres son obligatorios y las contraseñas deben tener entre 12 y 72 bytes UTF-8.");
        }
        if (adminUsername.contains(":") || userUsername.contains(":")) {
            throw new IllegalStateException("Los nombres de usuario no pueden contener dos puntos.");
        }
        if (adminUsername.equalsIgnoreCase(userUsername)) {
            throw new IllegalStateException("El usuario administrador y el usuario de consulta deben ser distintos.");
        }
    }

    private int bytes(String password) {
        return password.getBytes(StandardCharsets.UTF_8).length;
    }
}
