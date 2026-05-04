package com.indigo.smarttravel.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.indigo.smarttravel.entity.Flight;
import com.indigo.smarttravel.repository.FlightRepository;

@Service
public class FlightService {

    @Autowired
    private FlightRepository flightRepository;

    public List<Flight> getAllFlights() {
        return flightRepository.findAll();
    }

    public Optional<Flight> getFlightById(Long id) {
        return flightRepository.findById(id);
    }

    public List<Flight> searchFlights(String source, String destination, LocalDate travelDate) {
        if (travelDate != null) {
            return flightRepository.findBySourceAndDestinationAndTravelDate(source, destination, travelDate);
        }
        return flightRepository.findBySourceAndDestination(source, destination);
    }

    public List<Flight> searchFlightsWithFilters(String source, String destination, LocalDate travelDate,
            java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice, String airline,
            LocalDateTime departureTime, LocalDateTime arrivalTime) {
        return flightRepository.searchFlights(source, destination, travelDate, minPrice, maxPrice, airline, departureTime, arrivalTime);
    }

    public List<Flight> getFlightsByDate(LocalDate date) {
        return flightRepository.findByTravelDate(date);
    }

    public Flight updateFlightStatus(Long id, String status) {
        return flightRepository.findById(id).map(flight -> {
            flight.setStatus(status);
            return flightRepository.save(flight);
        }).orElseThrow(() -> new RuntimeException("Flight not found"));
    }

    public Flight createFlight(Flight flight) {
        return flightRepository.save(flight);
    }
}