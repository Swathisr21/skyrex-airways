package com.indigo.smarttravel.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.indigo.smarttravel.entity.Booking;
import com.indigo.smarttravel.entity.Flight;
import com.indigo.smarttravel.entity.Passenger;
import com.indigo.smarttravel.repository.BookingRepository;
import com.indigo.smarttravel.repository.FlightRepository;
import com.indigo.smarttravel.repository.PaymentRepository;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Optional<Booking> getBookingById(Long id) {
        return bookingRepository.findById(id);
    }

    public Optional<Booking> getBookingByReference(String reference) {
        return bookingRepository.findByBookingReference(reference);
    }

    public List<Booking> getBookingsByUserId(Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    @Transactional
    public Booking createBooking(Long flightId, Long userId, String passengerName, int seats, String selectedSeats, List<Passenger> passengers) {
        Flight flight = flightRepository.findById(flightId)
                .orElseThrow(() -> new RuntimeException("Flight not found"));

        if (flight.getAvailableSeats() < seats) {
            throw new RuntimeException("Not enough seats available");
        }

        Booking booking = new Booking();
        booking.setBookingReference(generateBookingReference());
        booking.setFlight(flight);
        booking.setUser(new com.indigo.smarttravel.entity.User());
        booking.getUser().setId(userId);
        booking.setPassengerName(passengerName);
        booking.setSeatsBooked(seats);
        booking.setSelectedSeats(selectedSeats);
        booking.setTotalAmount(flight.getPrice().multiply(BigDecimal.valueOf(seats)));
        booking.setBookingDate(LocalDateTime.now());
        booking.setStatus("CONFIRMED");

        if (passengers != null) {
            booking.setPassengers(passengers);
            passengers.forEach(p -> p.setBooking(booking));
        }

        flight.setAvailableSeats(flight.getAvailableSeats() - seats);
        flightRepository.save(flight);

        return bookingRepository.save(booking);
    }

    public Booking cancelBooking(Long id) {
        return bookingRepository.findById(id).map(booking -> {
            booking.setStatus("CANCELLED");
            return bookingRepository.save(booking);
        }).orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    private String generateBookingReference() {
        return "IND" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}