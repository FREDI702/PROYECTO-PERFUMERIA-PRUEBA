package com.perfumeria.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "ADMIN_USERNAME=admin-prueba",
        "ADMIN_PASSWORD=TestAdminPass123!",
        "USER_USERNAME=usuario-prueba",
        "USER_PASSWORD=TestUserPass123!"
})
@AutoConfigureMockMvc
class PerfumeriaApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void lasRutasDeLaApiResponden() throws Exception {
        for (String ruta : new String[]{
                "/api/clientes",
                "/api/marcas",
                "/api/perfumes",
                "/api/ventas",
                "/api/detalle-ventas",
                "/api/pedidos",
                "/api/recepciones"
        }) {
            mockMvc.perform(get(ruta).with(httpBasic("admin-prueba", "TestAdminPass123!")))
                    .andExpect(status().isOk());
        }
    }

    @Test
    void lasRutasDeLaApiRechazanSolicitudesSinCredenciales() throws Exception {
        mockMvc.perform(get("/api/clientes"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist("WWW-Authenticate"));
    }

    @Test
    void usuarioPuedeConsultarYNoPuedeModificar() throws Exception {
        mockMvc.perform(get("/api/auth/me").with(httpBasic("usuario-prueba", "TestUserPass123!")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rol").value("USUARIO"));

        for (String ruta : new String[]{
                "/api/clientes",
                "/api/marcas",
                "/api/perfumes",
                "/api/ventas",
                "/api/detalle-ventas",
                "/api/pedidos",
                "/api/recepciones"
        }) {
            mockMvc.perform(get(ruta).with(httpBasic("usuario-prueba", "TestUserPass123!")))
                    .andExpect(status().isOk());
        }

        mockMvc.perform(post("/api/clientes")
                        .with(httpBasic("usuario-prueba", "TestUserPass123!"))
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void administradorRecibeElRolCorrecto() throws Exception {
        mockMvc.perform(get("/api/auth/me").with(httpBasic("admin-prueba", "TestAdminPass123!")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rol").value("ADMIN"));
    }

    @Test
    void registroPublicoCreaSoloUnUsuarioDeConsulta() throws Exception {
        String username = "nuevo-usuario";
        String email = "nuevo-usuario@example.com";
        String password = "NuevaClaveSegura123!";
        String solicitud = """
                {"usuario":"%s","correo":"%s","contrasena":"%s","confirmarContrasena":"%s","rol":"ADMIN"}
                """.formatted(username, email, password, password);

        mockMvc.perform(post("/api/auth/registro")
                        .contentType(APPLICATION_JSON)
                        .content(solicitud))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuario").value(username))
                .andExpect(jsonPath("$.rol").value("USUARIO"))
                .andExpect(jsonPath("$.contrasena").doesNotExist());

        mockMvc.perform(get("/api/auth/me").with(httpBasic(username, password)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rol").value("USUARIO"));

        mockMvc.perform(get("/api/auth/me").with(httpBasic(email, password)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usuario").value(username))
                .andExpect(jsonPath("$.rol").value("USUARIO"));

        mockMvc.perform(post("/api/auth/registro")
                        .contentType(APPLICATION_JSON)
                        .content(solicitud))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/auth/registro")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"usuario":"otro-usuario","correo":"NUEVO-USUARIO@example.com","contrasena":"OtraClaveSegura123!","confirmarContrasena":"OtraClaveSegura123!"}
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    void registroRechazaClavesDebiles() throws Exception {
        mockMvc.perform(post("/api/auth/registro")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"usuario":"clave-corta","correo":"corta@example.com","contrasena":"123","confirmarContrasena":"123"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registroRechazaContrasenasQueNoCoinciden() throws Exception {
        mockMvc.perform(post("/api/auth/registro")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"usuario":"no-coincide","correo":"no-coincide@example.com","contrasena":"ClaveSegura123!","confirmarContrasena":"OtraClaveSegura123!"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registroRechazaCorreoInvalido() throws Exception {
        mockMvc.perform(post("/api/auth/registro")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"usuario":"correo-invalido","correo":"no-es-correo","contrasena":"ClaveSegura123!","confirmarContrasena":"ClaveSegura123!"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void contextLoads() {
    }
}
