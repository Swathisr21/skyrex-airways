import React, { useEffect, useState } from "react";
import axios from "axios";
import BoardingPass from "./BoardingPass";
import { normalizeSeats } from "../utils/seatUtils";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8080/bookings");
      setBookings(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch bookings. Make sure backend is running.");
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) {
      try {
        await axios.delete(`http://localhost:8080/bookings/${bookingId}`);
        alert("Booking cancelled successfully!");
        fetchBookings(); // Refresh the list
      } catch (err) {
        alert("Failed to cancel booking. Please try again.");
        console.error("Cancellation error:", err);
      }
    }
  };

  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
  };

  const closeBookingDetails = () => {
    setSelectedBooking(null);
  };

  if (loading) {
    return (
      <div className="my-bookings-page">
        <div className="page-header">
          <h1>My Bookings</h1>
        </div>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-bookings-page">
        <div className="page-header">
          <h1>My Bookings</h1>
        </div>
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchBookings} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      <div className="page-header">
        <h1>My Bookings</h1>
        <button onClick={fetchBookings} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎫</div>
          <h3>No Bookings Yet</h3>
          <p>You haven't made any flight bookings yet. Start exploring and book your first flight!</p>
          <button className="btn-book-now" onClick={() => window.location.hash = '#dashboard'}>
            🛫 Book Your First Flight
          </button>
        </div>
      ) : (
        <div className="bookings-container">
          <div className="bookings-summary">
            <div className="summary-card">
              <span className="summary-number">{bookings.length}</span>
              <span className="summary-label">Total Bookings</span>
            </div>
            <div className="summary-card">
              <span className="summary-number">
                {bookings.reduce((sum, b) => sum + (b.seatsBooked || 0), 0)}
              </span>
              <span className="summary-label">Seats Booked</span>
            </div>
          </div>

          <div className="bookings-list">
            {bookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                  <div className="booking-card-header">
                    <div className="booking-id-section">
                      <span className="booking-id-label">Booking ID</span>
                      <span className="booking-id-value">IND{booking.id.toString().padStart(8, '0')}</span>
                    </div>
                    <span className={`booking-status ${booking.status === 'CANCELLED' ? 'cancelled' : 'confirmed'}`}>
                      {booking.status === 'CANCELLED' ? 'Cancelled' : 'Confirmed'}
                    </span>
                  </div>

                   <div className="booking-card-body">
                   <div className="flight-info">
                     <div className="flight-number">{booking.flight?.flightNumber}</div>
                     <div className="route">
                       <span className="city">{booking.flight?.source}</span>
                       <span className="arrow">→</span>
                       <span className="city">{booking.flight?.destination}</span>
                     </div>
                     <div className="flight-time">
                       {booking.flight?.departureTime} - {booking.flight?.arrivalTime}
                     </div>
                   </div>

                   <div className="booking-details-grid">
                     <div className="detail-item">
                       <span className="detail-label">Passenger</span>
                       <span className="detail-value">{booking.passengerName}</span>
                     </div>
                      <div className="detail-item">
                        <span className="detail-label">Seats</span>
                        <span className="detail-value">
                          {(() => {
                            const seats = normalizeSeats(booking.selectedSeats);
                            return seats.length > 0 ? seats.join(', ') : booking.seatsBooked;
                          })()}
                        </span>
                      </div>
                     <div className="detail-item">
                       <span className="detail-label">Price</span>
                       <span className="detail-value price">
                         ₹{booking.flight?.price * booking.seatsBooked}
                       </span>
                     </div>
                   </div>
                 </div>

                 <div className="booking-card-footer">
                   <button className="btn-view" onClick={() => viewBookingDetails(booking)}>
                     📋 View Details
                   </button>
                   {booking.status !== 'CANCELLED' && (
                     <button 
                       className="btn-cancel"
                       onClick={() => cancelBooking(booking.id)}
                     >
                       ❌ Cancel Booking
                     </button>
                   )}
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Details Modal with Boarding Pass */}
      {selectedBooking && (
        <BoardingPass 
          booking={selectedBooking}
          onClose={closeBookingDetails}
        />
      )}
    </div>
  );
}

export default MyBookings;
