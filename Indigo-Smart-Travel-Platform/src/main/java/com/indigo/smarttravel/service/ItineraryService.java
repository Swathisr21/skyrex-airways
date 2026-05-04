package com.indigo.smarttravel.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.indigo.smarttravel.entity.Itinerary;
import com.indigo.smarttravel.repository.ItineraryRepository;

@Service
public class ItineraryService {

    @Autowired
    private ItineraryRepository itineraryRepository;

    public List<Itinerary> getAllItineraries() {
        return itineraryRepository.findAll();
    }

    public Optional<Itinerary> getItineraryById(Long id) {
        return itineraryRepository.findById(id);
    }

    public Optional<Itinerary> getItineraryByBookingId(Long bookingId) {
        return itineraryRepository.findByBookingId(bookingId);
    }

    public List<Itinerary> getItinerariesByType(String type) {
        return itineraryRepository.findByType(type);
    }

    public Itinerary createItinerary(Itinerary itinerary) {
        itinerary.setItineraryNumber("ITN" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        return itineraryRepository.save(itinerary);
    }
}