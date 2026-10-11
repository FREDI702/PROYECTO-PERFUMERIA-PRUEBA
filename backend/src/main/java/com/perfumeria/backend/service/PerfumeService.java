package com.perfumeria.backend.service;

import com.perfumeria.backend.model.Perfume;
import com.perfumeria.backend.repository.PerfumeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PerfumeService {

    @Autowired
    private PerfumeRepository perfumeRepository;

    public List<Perfume> listarTodos() {
        return perfumeRepository.findAll();
    }

    public Optional<Perfume> buscarPorId(Long id) {
        return perfumeRepository.findById(id);
    }

    public Perfume guardar(Perfume perfume) {
        perfume.setId(null);
        return perfumeRepository.save(perfume);
    }

    public Perfume actualizar(Long id, Perfume datos) {
        return perfumeRepository.findById(id).map(p -> {
            p.setIdMarca(datos.getIdMarca());
            p.setNombre(datos.getNombre());
            p.setGenero(datos.getGenero());
            p.setConcentracion(datos.getConcentracion());
            p.setMililitros(datos.getMililitros());
            p.setPrecio(datos.getPrecio());
            p.setStock(datos.getStock());
            return perfumeRepository.save(p);
        }).orElse(null);
    }

    public boolean eliminar(Long id) {
        if (perfumeRepository.existsById(id)) {
            perfumeRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
