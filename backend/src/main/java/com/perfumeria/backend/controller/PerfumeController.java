package com.perfumeria.backend.controller;

import com.perfumeria.backend.model.Perfume;
import com.perfumeria.backend.service.PerfumeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/perfumes")
public class PerfumeController {

    @Autowired
    private PerfumeService perfumeService;

    @GetMapping
    public List<Perfume> listar() {
        return perfumeService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Perfume> buscarPorId(@PathVariable Long id) {
        return perfumeService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Perfume> crear(@RequestBody Perfume perfume) {
        return ResponseEntity.status(HttpStatus.CREATED).body(perfumeService.guardar(perfume));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Perfume> actualizar(@PathVariable Long id, @RequestBody Perfume perfume) {
        Perfume actualizado = perfumeService.actualizar(id, perfume);
        if (actualizado != null) {
            return ResponseEntity.ok(actualizado);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (perfumeService.eliminar(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
