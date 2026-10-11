package com.perfumeria.backend.repository;

import com.perfumeria.backend.model.Perfume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PerfumeRepository extends JpaRepository<Perfume, Long> {
}
