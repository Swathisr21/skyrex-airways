package com.indigo.smarttravel.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.indigo.smarttravel.entity.Flight;

@Repository
public interface FlightRepository extends JpaRepository<Flight, Long> {
    
    List<Flight> findBySourceAndDestination(String source, String destination);
    
    List<Flight> findBySourceAndDestinationAndTravelDate(String source, String destination, LocalDate travelDate);
    
    List<Flight> findByTravelDate(LocalDate travelDate);
    
    @Query("SELECT f FROM Flight f WHERE " +
           "(:source IS NULL OR f.source = :source) AND " +
           "(:destination IS NULL OR f.destination = :destination) AND " +
           "(:travelDate IS NULL OR f.travelDate = :travelDate) AND " +
           "(:minPrice IS NULL OR f.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR f.price <= :maxPrice) AND " +
           "(:airline IS NULL OR f.airline = :airline) AND " +
           "(:departureTime IS NULL OR f.departureTime >= :departureTime) AND " +
           "(:arrivalTime IS NULL OR f.arrivalTime <= :arrivalTime)")
    List<Flight> searchFlights(
        @Param("source") String source,
        @Param("destination") String destination,
        @Param("travelDate") LocalDate travelDate,
        @Param("minPrice") java.math.BigDecimal minPrice,
        @Param("maxPrice") java.math.BigDecimal maxPrice,
        @Param("airline") String airline,
        @Param("departureTime") LocalDateTime departureTime,
        @Param("arrivalTime") LocalDateTime arrivalTime
    );
    
    List<Flight> findByAirline(String airline);
    
    List<Flight> findByStatus(String status);
}