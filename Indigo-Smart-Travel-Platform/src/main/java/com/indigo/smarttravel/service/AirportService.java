package com.indigo.smarttravel.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.indigo.smarttravel.entity.Airport;
import com.indigo.smarttravel.repository.AirportRepository;

@Service
public class AirportService {

    @Autowired
    private AirportRepository airportRepository;

    public List<Airport> getAllAirports() {
        return airportRepository.findAll();
    }

    public Optional<Airport> getAirportByCode(String code) {
        return airportRepository.findByCode(code);
    }

    public List<Airport> getAirportsByCountry(String country) {
        return airportRepository.findByCountry(country);
    }

    public List<Airport> getAirportsByCity(String city) {
        return airportRepository.findByCity(city);
    }

    public Airport createAirport(Airport airport) {
        return airportRepository.save(airport);
    }
}