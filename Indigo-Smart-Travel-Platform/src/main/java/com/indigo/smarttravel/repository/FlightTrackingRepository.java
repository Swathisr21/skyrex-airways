package com.indigo.smarttravel.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.indigo.smarttravel.entity.FlightTracking;

@Repository
public interface FlightTrackingRepository extends JpaRepository<FlightTracking, Long> {
    
    Optional<FlightTracking> findByFlightId(Long flightId);
    
    List<FlightTracking> findByStatus(String status);
}