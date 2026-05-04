package com.indigo.smarttravel.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.indigo.smarttravel.entity.CheckIn;
import com.indigo.smarttravel.service.CheckInService;

@RestController
@RequestMapping("/checkin")
@CrossOrigin(origins = "*")
public class CheckInController {

    @Autowired
    private CheckInService checkInService;

    @GetMapping
    public ResponseEntity<List<CheckIn>> getAllCheckIns() {
        return ResponseEntity.ok(checkInService.getAllCheckIns());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CheckIn> getCheckInById(@PathVariable Long id) {
        return checkInService.getCheckInById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<CheckIn> getCheckInByBookingId(@PathVariable Long bookingId) {
        return checkInService.getCheckInByBookingId(bookingId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/create")
    public ResponseEntity<CheckIn> createCheckIn(@RequestParam Long bookingId) {
        return ResponseEntity.ok(checkInService.createCheckIn(bookingId));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<CheckIn> completeCheckIn(@PathVariable String id) {
        return ResponseEntity.ok(checkInService.completeCheckIn(id));
    }
}