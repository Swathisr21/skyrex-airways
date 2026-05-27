package com.indigo.smarttravel.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.indigo.smarttravel.entity.Booking;
import com.indigo.smarttravel.entity.Passenger;
import com.indigo.smarttravel.service.BookingService;

@RestController
@RequestMapping("/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Booking> getBookingById(@PathVariable Long id) {
        return bookingService.getBookingById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking>> getBookingsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(bookingService.getBookingsByUserId(userId));
    }

    @PostMapping("/{flightId}")
    public ResponseEntity<Booking> createBooking(
            @PathVariable Long flightId,
            @RequestBody Map<String, Object> requestBody) {
        
        String passengerName = requestBody.getOrDefault("passengerName", "Passenger").toString();
        int seats = Integer.parseInt(requestBody.getOrDefault("seatsBooked", "1").toString());
        String selectedSeats = requestBody.getOrDefault("selectedSeats", "").toString();
        Long userId = 1L; // Default user for now; can be enhanced with JWT token
        
        @SuppressWarnings("unchecked")
        List<Passenger> passengers = requestBody.containsKey("passengers") 
            ? (List<Passenger>) requestBody.get("passengers") 
            : null;
            
        return ResponseEntity.ok(bookingService.createBooking(flightId, userId, passengerName, seats, selectedSeats, passengers));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Booking> updateBooking(@PathVariable Long id, @RequestBody Booking bookingDetails) {
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancelBooking(@PathVariable Long id) {
        bookingService.cancelBooking(id);
        return ResponseEntity.noContent().build();
    }
}