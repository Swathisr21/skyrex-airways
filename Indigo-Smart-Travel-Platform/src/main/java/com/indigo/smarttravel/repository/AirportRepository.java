package com.indigo.smarttravel.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.indigo.smarttravel.entity.Airport;

@Repository
public interface AirportRepository extends JpaRepository<Airport, Long> {
    
    Optional<Airport> findByCode(String code);
    
    List<Airport> findByCountry(String country);
    
    List<Airport> findByCity(String city);
}