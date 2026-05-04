package com.indigo.smarttravel.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.indigo.smarttravel.entity.Payment;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    
    Optional<Payment> findByPaymentId(String paymentId);
    
    Optional<Payment> findByBookingId(Long bookingId);
    
    List<Payment> findByStatus(String status);
    
    List<Payment> findByTransactionId(String transactionId);
}