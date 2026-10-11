package com.perfumeria.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
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
            mockMvc.perform(get(ruta)).andExpect(status().isOk());
        }
    }

    @Test
    void contextLoads() {
    }
}
