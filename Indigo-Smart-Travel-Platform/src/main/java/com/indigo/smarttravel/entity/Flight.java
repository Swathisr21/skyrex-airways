package com.indigo.smarttravel.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "flights")
public class Flight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String flightNumber;

    @Column(nullable = false)
    private String source;

    @Column(nullable = false)
    private String destination;

    @Column(nullable = false)
    private LocalDateTime departureTime;

    @Column(nullable = false)
    private LocalDateTime arrivalTime;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private int availableSeats;

    @Column(name = "travel_date")
    private LocalDate travelDate;

    @Column(nullable = false)
    private String airline = "Indigo";

    @Column(nullable = false)
    private String status = "ON_TIME";

    public Flight() {}

    public Flight(String flightNumber, String source, String destination, 
                  LocalDateTime departureTime, LocalDateTime arrivalTime, 
                  BigDecimal price, int availableSeats, LocalDate travelDate) {
        this.flightNumber = flightNumber;
        this.source = source;
        this.destination = destination;
        this.departureTime = departureTime;
        this.arrivalTime = arrivalTime;
        this.price = price;
        this.availableSeats = availableSeats;
        this.travelDate = travelDate;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFlightNumber() {
        return flightNumber;
    }

    public void setFlightNumber(String flightNumber) {
        this.flightNumber = flightNumber;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public LocalDateTime getDepartureTime() {
        return departureTime;
    }

    public void setDepartureTime(LocalDateTime departureTime) {
        this.departureTime = departureTime;
    }

    public LocalDateTime getArrivalTime() {
        return arrivalTime;
    }

    public void setArrivalTime(LocalDateTime arrivalTime) {
        this.arrivalTime = arrivalTime;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public int getAvailableSeats() {
        return availableSeats;
    }

    public void setAvailableSeats(int availableSeats) {
        this.availableSeats = availableSeats;
    }

    public LocalDate getTravelDate() {
        return travelDate;
    }

    public void setTravelDate(LocalDate travelDate) {
        this.travelDate = travelDate;
    }

    public String getAirline() {
        return airline;
    }

    public void setAirline(String airline) {
        this.airline = airline;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Flight flight = new Flight();

        public Builder flightNumber(String flightNumber) {
            flight.setFlightNumber(flightNumber);
            return this;
        }

        public Builder source(String source) {
            flight.setSource(source);
            return this;
        }

        public Builder destination(String destination) {
            flight.setDestination(destination);
            return this;
        }

        public Builder departureTime(LocalDateTime departureTime) {
            flight.setDepartureTime(departureTime);
            return this;
        }

        public Builder arrivalTime(LocalDateTime arrivalTime) {
            flight.setArrivalTime(arrivalTime);
            return this;
        }

        public Builder price(BigDecimal price) {
            flight.setPrice(price);
            return this;
        }

        public Builder availableSeats(int availableSeats) {
            flight.setAvailableSeats(availableSeats);
            return this;
        }

        public Builder travelDate(LocalDate travelDate) {
            flight.setTravelDate(travelDate);
            return this;
        }

        public Builder airline(String airline) {
            flight.setAirline(airline);
            return this;
        }

        public Builder status(String status) {
            flight.setStatus(status);
            return this;
        }

        public Flight build() {
            return flight;
        }
    }
}