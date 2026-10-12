package com.perfumeria.backend.controller;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.perfumeria.backend.service.RegistroCuentaService;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final RegistroCuentaService registroCuentaService;

    public AuthController(RegistroCuentaService registroCuentaService) {
        this.registroCuentaService = registroCuentaService;
    }

    @GetMapping("/me")
    public Map<String, String> sesionActual(Authentication authentication) {
        String rol = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"))
                ? "ADMIN"
                : "USUARIO";
        return Map.of("usuario", authentication.getName(), "rol", rol);
    }

    @PostMapping("/registro")
    public ResponseEntity<Map<String, String>> registrar(@RequestBody RegistroRequest solicitud) {
        if (solicitud == null || solicitud.usuario() == null
                || solicitud.correo() == null || solicitud.contrasena() == null
                || solicitud.confirmarContrasena() == null) {
            return ResponseEntity.badRequest().build();
        }
        String usuario = registroCuentaService.registrar(
                solicitud.usuario(),
                solicitud.correo(),
                solicitud.contrasena(),
                solicitud.confirmarContrasena()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("usuario", usuario, "rol", "USUARIO"));
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RegistroRequest(
            String usuario,
            String correo,
            String contrasena,
            String confirmarContrasena) {}
}
