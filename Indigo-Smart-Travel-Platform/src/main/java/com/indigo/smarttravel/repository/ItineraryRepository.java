package com.indigo.smarttravel.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.indigo.smarttravel.entity.Itinerary;

@Repository
public interface ItineraryRepository extends JpaRepository<Itinerary, Long> {
    
    Optional<Itinerary> findByItineraryNumber(String itineraryNumber);
    
    Optional<Itinerary> findByBookingId(Long bookingId);
    
    List<Itinerary> findByType(String type);
}