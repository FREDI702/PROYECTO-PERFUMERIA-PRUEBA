package com.perfumeria.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.junit.jupiter.api.Assertions.assertEquals;
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
        "USER_PASSWORD=TestUserPass123!",
        "MP_ACCESS_TOKEN=",
        "MP_WEBHOOK_SECRET=",
        "MP_WEBHOOK_URL=",
        "CLOUDINARY_CLOUD_NAME=demo-cloud",
        "CLOUDINARY_API_KEY=123456789012345",
        "CLOUDINARY_API_SECRET=test-cloudinary-secret"
})
@AutoConfigureMockMvc
class PerfumeriaApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

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
                "/api/marcas",
                "/api/perfumes"
        }) {
            mockMvc.perform(get(ruta).with(httpBasic("usuario-prueba", "TestUserPass123!")))
                    .andExpect(status().isOk());
        }

        for (String ruta : new String[]{
                "/api/clientes",
                "/api/ventas",
                "/api/detalle-ventas",
                "/api/pedidos",
                "/api/recepciones"
        }) {
            mockMvc.perform(get(ruta).with(httpBasic("usuario-prueba", "TestUserPass123!")))
                    .andExpect(status().isForbidden());
        }

        mockMvc.perform(post("/api/clientes")
                        .with(httpBasic("usuario-prueba", "TestUserPass123!"))
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/tienda/pedidos")
                        .with(httpBasic("usuario-prueba", "TestUserPass123!"))
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/tienda/pedidos/1")
                        .param("dni", "12345678")
                        .with(httpBasic("usuario-prueba", "TestUserPass123!")))
                .andExpect(status().isNotFound());
    }

    @Test
    void administradorRecibeElRolCorrecto() throws Exception {
        mockMvc.perform(get("/api/auth/me").with(httpBasic("admin-prueba", "TestAdminPass123!")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rol").value("ADMIN"));
    }

    @Test
    void laFirmaDeImagenEsPublicaSoloComoConfiguracionYLaCargaSoloParaAdmin() throws Exception {
        mockMvc.perform(get("/api/imagenes/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cloudName").value("demo-cloud"));

        mockMvc.perform(post("/api/imagenes/firma")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"publicId":"perfume-chanel-n5-edp-100ml"}
                                """))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/imagenes/firma")
                        .with(httpBasic("usuario-prueba", "TestUserPass123!"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"publicId":"perfume-chanel-n5-edp-100ml"}
                                """))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/imagenes/firma")
                        .with(httpBasic("admin-prueba", "TestAdminPass123!"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"publicId":"perfume-chanel-n5-edp-100ml"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cloudName").value("demo-cloud"))
                .andExpect(jsonPath("$.apiKey").value("123456789012345"))
                .andExpect(jsonPath("$.publicId").value("perfume-chanel-n5-edp-100ml"))
                .andExpect(jsonPath("$.signature").isNotEmpty())
                .andExpect(jsonPath("$.overwrite").value(true))
                .andExpect(jsonPath("$.apiSecret").doesNotExist());

        mockMvc.perform(post("/api/imagenes/firma")
                        .with(httpBasic("admin-prueba", "TestAdminPass123!"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {"publicId":"../no-permitido"}
                                """))
                .andExpect(status().isBadRequest());
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
    void usuarioPuedeComprarPerfumePorUnSolConYape() throws Exception {
        jdbcTemplate.update(
                "INSERT INTO public.marca (nombre_marca, estado) VALUES ('Dior', TRUE)");
        Long idMarca = jdbcTemplate.queryForObject(
                "SELECT id_marca FROM public.marca WHERE nombre_marca = 'Dior'",
                Long.class);
        jdbcTemplate.update(
                """
                INSERT INTO public.perfume
                    (id_marca, nombre, genero, concentracion, mililitros, precio, stock)
                VALUES (?, 'Fahrenheit', 'Masculino', 'Eau de Toilette', 100, 1.00, 2)
                """,
                idMarca);
        Long idPerfume = jdbcTemplate.queryForObject(
                "SELECT id_perfume FROM public.perfume WHERE nombre = 'Fahrenheit'",
                Long.class);

        mockMvc.perform(post("/api/tienda/pedidos")
                        .with(httpBasic("usuario-prueba", "TestUserPass123!"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "cliente": {
                                    "nombre": "Cliente",
                                    "apellido": "Prueba",
                                    "dniRuc": "87123456",
                                    "telefono": "987654321",
                                    "email": "cliente-prueba@example.com",
                                    "direccion": "Calle de prueba 123"
                                  },
                                  "metodoPago": "yape",
                                  "tipoComprobante": "boleta",
                                  "items": [{"idPerfume": %d, "cantidad": 1}]
                                }
                                """.formatted(idPerfume)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.total").value(1.0))
                .andExpect(jsonPath("$.metodoPago").value("yape"))
                .andExpect(jsonPath("$.correoEnviado").value(false))
                .andExpect(jsonPath("$.notificacionTiendaEnviada").value(false))
                .andExpect(jsonPath("$.items[0].nombre").value("Fahrenheit"));

        Integer stock = jdbcTemplate.queryForObject(
                "SELECT stock FROM public.perfume WHERE id_perfume = ?",
                Integer.class,
                idPerfume);
        assertEquals(1, stock);
    }

    @Test
    void tarjetaNoCreaPedidoCuandoMercadoPagoNoEstaConfigurado() throws Exception {
        mockMvc.perform(post("/api/tienda/pedidos")
                        .with(httpBasic("usuario-prueba", "TestUserPass123!"))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "cliente": {},
                                  "metodoPago": "tarjeta",
                                  "tipoComprobante": "boleta",
                                  "items": []
                                }
                                """))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.mensaje").value(
                        "El pago con tarjeta aún no está configurado. Usa Yape o efectivo, o inténtalo más tarde."));
    }

    @Test
    void contextLoads() {
    }
}
