package com.indigo.smarttravel.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.indigo.smarttravel.entity.FlightTracking;
import com.indigo.smarttravel.repository.FlightTrackingRepository;

@Service
public class FlightTrackingService {

    @Autowired
    private FlightTrackingRepository flightTrackingRepository;

    public List<FlightTracking> getAllFlightTracking() {
        return flightTrackingRepository.findAll();
    }

    public Optional<FlightTracking> getFlightTrackingByFlightId(Long flightId) {
        return flightTrackingRepository.findByFlightId(flightId);
    }

    public List<FlightTracking> getFlightTrackingByStatus(String status) {
        return flightTrackingRepository.findByStatus(status);
    }

    public FlightTracking createFlightTracking(FlightTracking flightTracking) {
        flightTracking.setLastUpdated(LocalDateTime.now());
        return flightTrackingRepository.save(flightTracking);
    }

    public FlightTracking updateFlightTracking(Long id, FlightTracking flightTrackingDetails) {
        return flightTrackingRepository.findById(id).map(flightTracking -> {
            flightTracking.setStatus(flightTrackingDetails.getStatus());
            flightTracking.setLatitude(flightTrackingDetails.getLatitude());
            flightTracking.setLongitude(flightTrackingDetails.getLongitude());
            flightTracking.setAltitude(flightTrackingDetails.getAltitude());
            flightTracking.setSpeed(flightTrackingDetails.getSpeed());
            flightTracking.setLastUpdated(LocalDateTime.now());
            return flightTrackingRepository.save(flightTracking);
        }).orElseThrow(() -> new RuntimeException("Flight tracking not found"));
    }
}