package com.perfumeria.backend.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.math.BigDecimal;

@Component
@Profile("local-demo")
public class DemoCatalogInitializer implements ApplicationRunner {

    private static final String MARCA_PRUEBA = "Dior";
    private static final String PERFUME_PRUEBA = "Fahrenheit";

    private final DataSource dataSource;
    private final JdbcTemplate jdbcTemplate;

    public DemoCatalogInitializer(DataSource dataSource, JdbcTemplate jdbcTemplate) {
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        try (var connection = dataSource.getConnection()) {
            String jdbcUrl = connection.getMetaData().getURL();
            if (jdbcUrl == null || !jdbcUrl.startsWith("jdbc:h2:")) {
                throw new IllegalStateException(
                        "El perfil local-demo solo puede ejecutarse con una base H2 aislada.");
            }
        }

        Long idMarca = jdbcTemplate.query(
                "SELECT id_marca FROM public.marca WHERE LOWER(nombre_marca) = LOWER(?)",
                result -> result.next() ? result.getLong("id_marca") : null,
                MARCA_PRUEBA);
        if (idMarca == null) {
            jdbcTemplate.update(
                    "INSERT INTO public.marca (nombre_marca, estado) VALUES (?, TRUE)",
                    MARCA_PRUEBA);
            idMarca = jdbcTemplate.queryForObject(
                    "SELECT id_marca FROM public.marca WHERE LOWER(nombre_marca) = LOWER(?)",
                    Long.class,
                    MARCA_PRUEBA);
        }
        jdbcTemplate.update(
                """
                INSERT INTO public.perfume
                    (id_marca, nombre, genero, concentracion, mililitros, precio, stock)
                VALUES (?, ?, 'Masculino', 'Eau de Toilette', 100, ?, 10)
                """,
                idMarca,
                PERFUME_PRUEBA,
                BigDecimal.ONE);
    }
}
