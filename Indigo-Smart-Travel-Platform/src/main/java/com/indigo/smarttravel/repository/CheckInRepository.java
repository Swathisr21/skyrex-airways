package com.indigo.smarttravel.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.indigo.smarttravel.entity.CheckIn;

@Repository
public interface CheckInRepository extends JpaRepository<CheckIn, Long> {
    
    Optional<CheckIn> findByCheckInId(String checkInId);
    
    Optional<CheckIn> findByBookingId(Long bookingId);
    
    List<CheckIn> findByStatus(String status);
}