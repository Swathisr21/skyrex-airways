import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

function FlightPanel({ onSelectFlight, onBookFlight }) {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchFlights();
    // Real-time updates every 5 seconds
    intervalRef.current = setInterval(() => {
      fetchFlights(true); // Silent refresh
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchFlights = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const response = await axios.get("http://localhost:8080/flights");
      setFlights(response.data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      if (!silent) {
        setError("Failed to fetch flights. Make sure backend is running.");
      }
      console.error("Error fetching flights:", err);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleBookFlight = async (flightId) => {
    try {
      const bookingData = {
        passengerName: "Passenger",
        seatsBooked: 1
      };
      
      await axios.post(`http://localhost:8080/bookings/${flightId}`, bookingData);
      alert("Ticket Booked Successfully!");
      
      // Refresh flights to update available seats
      fetchFlights();
      
      if (onBookFlight) {
        onBookFlight();
      }
    } catch (err) {
      alert("Booking failed. Please try again.");
      console.error("Booking error:", err);
    }
  };

  if (loading && flights.length === 0) {
    return (
      <aside className="panel flight-panel">
        <h2>Flight Status</h2>
        <div className="loading">Loading flights...</div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="panel flight-panel">
        <h2>Flight Status</h2>
        <div className="error">{error}</div>
        <button onClick={fetchFlights} className="retry-btn">Retry</button>
      </aside>
    );
  }

  return (
    <aside className="panel flight-panel">
      <div className="panel-header">
        <h2>Flight Status</h2>
        <div className="refresh-indicator">
          <span className="live-dot"></span>
          <span className="update-time">Updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>
      
      {flights.length === 0 ? (
        <div className="no-flights">
          <p>No flights available at the moment.</p>
          <p>Add some flights using the admin panel or API.</p>
        </div>
      ) : (
        <div className="flight-list">
          {flights.map(flight => (
            <div className="flight-card card" key={flight.id}>
              <div className="flight-header">
                <h3>{flight.flightNumber}</h3>
                <span className={`status ${flight.availableSeats > 0 ? 'available' : 'full'}`}>
                  {flight.availableSeats > 0 ? 'Available' : 'Full'}
                </span>
              </div>
              
              <div className="flight-route">
                <span className="city">{flight.source}</span>
                <span className="arrow">→</span>
                <span className="city">{flight.destination}</span>
              </div>
              
              <div className="flight-times">
                <div className="time-info">
                  <span className="label">Departure</span>
                  <span className="time">{flight.departureTime}</span>
                </div>
                <div className="time-info">
                  <span className="label">Arrival</span>
                  <span className="time">{flight.arrivalTime}</span>
                </div>
              </div>
              
              <div className="flight-details">
                <div className="detail">
                  <span className="label">Price</span>
                  <span className="price">₹{flight.price}</span>
                </div>
                <div className="detail">
                  <span className="label">Seats</span>
                  <span className={`seats ${flight.availableSeats < 10 ? 'low' : ''}`}>
                    {flight.availableSeats} left
                  </span>
                </div>
              </div>
              
              <div className="flight-actions">
                <button 
                  className="btn-track"
                  onClick={() => onSelectFlight(flight)}
                  disabled={flight.availableSeats === 0}
                >
                  Track Route
                </button>
                <button 
                  className="btn-book"
                  onClick={() => handleBookFlight(flight.id)}
                  disabled={flight.availableSeats === 0}
                >
                  Book Ticket
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

export default FlightPanel;