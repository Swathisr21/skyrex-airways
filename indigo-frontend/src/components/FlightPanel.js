import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { NotificationManager } from "./NotificationManager";

// Simulated flight statuses for real-time feel
const FLIGHT_STATUSES = ['On Time', 'Delayed', 'Boarding', 'Gate Open', 'Final Call'];

function getRandomStatus() {
  const weights = [0.6, 0.15, 0.1, 0.1, 0.05];
  const random = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (random < sum) return FLIGHT_STATUSES[i];
  }
  return FLIGHT_STATUSES[0];
}

function FlightPanel({ onSelectFlight, onBookFlight }) {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [flightStatuses, setFlightStatuses] = useState({});
  const [liveBadge, setLiveBadge] = useState(true);
  const intervalRef = useRef(null);
  const statusIntervalRef = useRef(null);

  // Initialize simulated statuses
  const initStatuses = useCallback((flightData) => {
    const statuses = {};
    flightData.forEach(f => {
      statuses[f.id] = {
        status: getRandomStatus(),
        gate: `A${Math.floor(Math.random() * 15) + 1}`,
        terminal: `T${Math.floor(Math.random() * 3) + 1}`,
        delayMinutes: Math.floor(Math.random() * 30)
      };
    });
    setFlightStatuses(statuses);
  }, []);

  const fetchFlights = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const response = await axios.get("http://localhost:8080/flights");
      const fetchedFlights = response.data;
      setFlights(fetchedFlights);
      setError(null);
      setLastUpdated(new Date());
      
      // Initialize statuses if not already set
      if (Object.keys(flightStatuses).length === 0) {
        initStatuses(fetchedFlights);
      }
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

  // Simulate real-time status updates
  const simulateStatusUpdates = useCallback(() => {
    setFlightStatuses(prev => {
      const updated = { ...prev };
      const flightIds = Object.keys(updated);
      
      // Randomly update 1-2 flights
      const numUpdates = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < numUpdates && i < flightIds.length; i++) {
        const randomId = flightIds[Math.floor(Math.random() * flightIds.length)];
        const newStatus = getRandomStatus();
        const oldStatus = updated[randomId]?.status;
        
        updated[randomId] = {
          ...updated[randomId],
          status: newStatus,
          updatedAt: new Date()
        };
        
        // Send notification for significant changes
        if (oldStatus !== 'Delayed' && newStatus === 'Delayed' && 'Notification' in window) {
          const flight = flights.find(f => f.id.toString() === randomId);
          if (flight) {
            NotificationManager.flightDelayed({
              flightNumber: flight.flightNumber,
              source: flight.source,
              destination: flight.destination,
              newDepartureTime: flight.departureTime
            });
          }
        }
      }
      
      return updated;
    });
    
    // Flash the live badge
    setLiveBadge(false);
    setTimeout(() => setLiveBadge(true), 500);
  }, [flights]);

  useEffect(() => {
    fetchFlights();
    
    // Real-time updates every 30 seconds as requested
    intervalRef.current = setInterval(() => {
      fetchFlights(true); // Silent refresh
    }, 30000);

    // Simulate status updates every 15 seconds for live feel
    statusIntervalRef.current = setInterval(() => {
      simulateStatusUpdates();
    }, 15000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    };
  }, [simulateStatusUpdates]);

  const handleBookFlight = async (flightId) => {
    try {
      const bookingData = {
        passengerName: "Passenger",
        seatsBooked: 1
      };
      
      await axios.post(`http://localhost:8080/bookings/${flightId}`, bookingData);
      
      if (window.showIndigoToast) {
        window.showIndigoToast('Success', 'Ticket Booked Successfully!', 'success', '🎉');
      }
      
      fetchFlights();
      
      if (onBookFlight) {
        onBookFlight();
      }
    } catch (err) {
      if (window.showIndigoToast) {
        window.showIndigoToast('Error', 'Booking failed. Please try again.', 'error', '❌');
      }
      console.error("Booking error:", err);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'On Time': return 'available';
      case 'Delayed': return 'delayed';
      case 'Boarding': return 'boarding';
      case 'Gate Open': return 'live';
      case 'Final Call': return 'live';
      default: return 'available';
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
        <button onClick={() => fetchFlights()} className="retry-btn">Retry</button>
      </aside>
    );
  }

  return (
    <aside className="panel flight-panel">
      <div className="panel-header">
        <h2>Flight Status</h2>
        <div className="refresh-indicator">
          {liveBadge && <span className="live-dot"></span>}
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
          {flights.map(flight => {
            const statusInfo = flightStatuses[flight.id] || { status: 'On Time', gate: 'TBA' };
            return (
              <div className="flight-card card" key={flight.id}>
                <div className="flight-header">
                  <h3>{flight.flightNumber}</h3>
                  <span className={`status ${getStatusClass(statusInfo.status)}`}>
                    {statusInfo.status}
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

                {/* Real-time info row */}
                <div className="flight-meta-row" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  background: 'var(--indigo-primary-lighter)',
                  borderRadius: '8px',
                  fontSize: '0.8rem'
                }}>
                  <span style={{ color: 'var(--indigo-primary)', fontWeight: 600 }}>
                    Gate: {statusInfo.gate}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Terminal: {statusInfo.terminal}
                  </span>
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
            );
          })}
        </div>
      )}
    </aside>
  );
}

export default FlightPanel;
