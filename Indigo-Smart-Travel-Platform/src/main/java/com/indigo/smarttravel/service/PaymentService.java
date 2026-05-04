package com.indigo.smarttravel.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.indigo.smarttravel.entity.Booking;
import com.indigo.smarttravel.entity.Payment;
import com.indigo.smarttravel.repository.BookingRepository;
import com.indigo.smarttravel.repository.PaymentRepository;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public Optional<Payment> getPaymentById(Long id) {
        return paymentRepository.findById(id);
    }

    public Optional<Payment> getPaymentByBookingId(Long bookingId) {
        return paymentRepository.findByBookingId(bookingId);
    }

    public Payment createPayment(Long bookingId, BigDecimal amount, String paymentMethod) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        Payment payment = new Payment();
        payment.setPaymentId("PAY" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        payment.setBooking(booking);
        payment.setAmount(amount);
        payment.setStatus("PENDING");
        payment.setPaymentMethod(paymentMethod);
        payment.setCreatedAt(LocalDateTime.now());

        return paymentRepository.save(payment);
    }

    public Payment processPayment(Long paymentId) {
        return paymentRepository.findById(paymentId).map(payment -> {
            payment.setStatus("COMPLETED");
            payment.setTransactionId("TXN" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
            return paymentRepository.save(payment);
        }).orElseThrow(() -> new RuntimeException("Payment not found"));
    }

    public Payment refundPayment(Long paymentId) {
        return paymentRepository.findById(paymentId).map(payment -> {
            payment.setStatus("REFUNDED");
            return paymentRepository.save(payment);
        }).orElseThrow(() -> new RuntimeException("Payment not found"));
    }
}