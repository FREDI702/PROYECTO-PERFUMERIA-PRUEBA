package com.perfumeria.backend.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class CuentaSchemaInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public CuentaSchemaInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS public.app_users (
                    username VARCHAR(32) PRIMARY KEY,
                    email VARCHAR(254) NOT NULL UNIQUE,
                    password_hash VARCHAR(100) NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
                """);
        jdbcTemplate.execute("""
                ALTER TABLE public.app_users
                ADD COLUMN IF NOT EXISTS email VARCHAR(254)
                """);
        jdbcTemplate.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS app_users_email_unique
                ON public.app_users (email)
                """);
    }
}
