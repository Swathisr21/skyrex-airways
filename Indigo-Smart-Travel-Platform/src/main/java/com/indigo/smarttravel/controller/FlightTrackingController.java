package com.indigo.smarttravel.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.indigo.smarttravel.entity.FlightTracking;
import com.indigo.smarttravel.service.FlightTrackingService;

@RestController
@RequestMapping("/flight-tracking")
@CrossOrigin(origins = "*")
public class FlightTrackingController {

    @Autowired
    private FlightTrackingService flightTrackingService;

    @GetMapping
    public ResponseEntity<List<FlightTracking>> getAllFlightTracking() {
        return ResponseEntity.ok(flightTrackingService.getAllFlightTracking());
    }

    @GetMapping("/flight/{flightId}")
    public ResponseEntity<FlightTracking> getFlightTrackingByFlightId(@PathVariable Long flightId) {
        return flightTrackingService.getFlightTrackingByFlightId(flightId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}