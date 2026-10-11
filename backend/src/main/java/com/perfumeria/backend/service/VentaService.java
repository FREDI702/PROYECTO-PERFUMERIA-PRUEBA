package com.perfumeria.backend.service;

import com.perfumeria.backend.model.Venta;
import com.perfumeria.backend.repository.VentaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class VentaService {

    @Autowired
    private VentaRepository ventaRepository;

    public List<Venta> obtenerTodasLasVentas() {
        return ventaRepository.findAll();
    }

    public Optional<Venta> buscarPorId(Long id) {
        return ventaRepository.findById(id);
    }

    public Venta guardar(Venta venta) {
        venta.setId(null);
        return ventaRepository.save(venta);
    }

    public Venta actualizar(Long id, Venta venta) {
        if (!ventaRepository.existsById(id)) {
            return null;
        }
        venta.setIdVenta(id);
        return ventaRepository.save(venta);
    }

    public boolean eliminar(Long id) {
        if (ventaRepository.existsById(id)) {
            ventaRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
