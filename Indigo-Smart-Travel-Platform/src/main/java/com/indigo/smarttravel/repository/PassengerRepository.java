package com.indigo.smarttravel.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.indigo.smarttravel.entity.Passenger;

@Repository
public interface PassengerRepository extends JpaRepository<Passenger, Long> {
    
    List<Passenger> findByBookingId(Long bookingId);
}