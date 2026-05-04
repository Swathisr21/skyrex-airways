package com.indigo.smarttravel.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.indigo.smarttravel.entity.Booking;
import com.indigo.smarttravel.entity.CheckIn;
import com.indigo.smarttravel.repository.BookingRepository;
import com.indigo.smarttravel.repository.CheckInRepository;

@Service
public class CheckInService {

    @Autowired
    private CheckInRepository checkInRepository;

    @Autowired
    private BookingRepository bookingRepository;

    public List<CheckIn> getAllCheckIns() {
        return checkInRepository.findAll();
    }

    public Optional<CheckIn> getCheckInById(Long id) {
        return checkInRepository.findById(id);
    }

    public Optional<CheckIn> getCheckInByBookingId(Long bookingId) {
        return checkInRepository.findByBookingId(bookingId);
    }

    public CheckIn createCheckIn(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        CheckIn checkIn = new CheckIn();
        checkIn.setCheckInId("CHK" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        checkIn.setBooking(booking);
        checkIn.setStatus("CONFIRMED");
        checkIn.setCheckInTime(LocalDateTime.now());
        checkIn.setExpiryTime(LocalDateTime.now().plusHours(24));
        checkIn.setGateNumber("G" + (int)(Math.random() * 20 + 1));
        checkIn.setBoardingTime(booking.getFlight().getDepartureTime().minusMinutes(30));
        checkIn.setSeatNumber(booking.getSelectedSeats().split(",")[0]);

        return checkInRepository.save(checkIn);
    }

    public CheckIn completeCheckIn(String checkInId) {
        return checkInRepository.findByCheckInId(checkInId).map(checkIn -> {
            checkIn.setStatus("COMPLETED");
            return checkInRepository.save(checkIn);
        }).orElseThrow(() -> new RuntimeException("Check-in not found"));
    }
}