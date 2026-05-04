package com.indigo.smarttravel.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.indigo.smarttravel.entity.Booking;
import com.indigo.smarttravel.entity.User;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    Optional<Booking> findByBookingReference(String bookingReference);
    
    List<Booking> findByUser(User user);
    
    List<Booking> findByUserId(Long userId);
    
    List<Booking> findByStatus(String status);
    
    List<Booking> findByFlightId(Long flightId);
}