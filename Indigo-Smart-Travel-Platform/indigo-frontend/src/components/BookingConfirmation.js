import React, { useState } from "react";
import BoardingPass from "./BoardingPass";
import axios from "axios";
import { normalizeSeats } from "../utils/seatUtils";

function BookingConfirmation({ booking, onClose }) {
  const [emailStatus, setEmailStatus] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!booking) return null;

  const bookingId = `IND${booking.id.toString().padStart(8, '0')}`;
  const bookingDate = new Date().toLocaleString();
  const seatNumbers = normalizeSeats(booking.selectedSeats);

  // Send email with PDF ticket
  const sendEmail = async () => {
    setIsSending(true);
    setEmailStatus('Sending email...');
    
    try {
      const response = await axios.post('/api/email/send-ticket', null, {
        params: { bookingId: booking.id }
      });
      
      if (response.data.success) {
        setEmailStatus('✅ Email sent successfully!');
      } else {
        setEmailStatus('⚠️ Email sent (check SMTP config)');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setEmailStatus('❌ Failed to send email');
    } finally {
      setIsSending(false);
      setTimeout(() => setEmailStatus(''), 3000);
    }
  };

  // Download PDF ticket
  const downloadPDF = async () => {
    try {
      const response = await axios.get('/api/email/download-ticket', {
        params: { bookingId: booking.id },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ticket_${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content booking-confirmation" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-header success">
          <div className="success-icon">✓</div>
          <h3>Booking Confirmed!</h3>
        </div>

        <div className="confirmation-body">
          <div className="confirmation-details">
            <div className="detail-row">
              <span className="label">Booking ID</span>
              <span className="value booking-id">{bookingId}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Flight</span>
              <span className="value">{booking.flight?.flightNumber}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Route</span>
              <span className="value">
                {booking.flight?.source} → {booking.flight?.destination}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="label">Passenger</span>
              <span className="value">{booking.passengerName}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Seats</span>
              <span className="value">{seatNumbers.join(', ')}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Departure</span>
              <span className="value">{booking.flight?.departureTime}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Price</span>
              <span className="value price">₹{booking.flight?.price * booking.seatsBooked}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Booked On</span>
              <span className="value">{bookingDate}</span>
            </div>
          </div>

          <div className="confirmation-footer">
            <div className="info-box">
              <span className="info-icon">ℹ️</span>
              <p>Please save your Booking ID <strong>{bookingId}</strong> for future reference.</p>
            </div>
            
            <div className="ticket-actions">
              <h4>Get Your Ticket:</h4>
              <div className="action-buttons">
                <button 
                  className="btn-email" 
                  onClick={sendEmail}
                  disabled={isSending}
                >
                  📧 Email Ticket
                </button>
                <button className="btn-pdf" onClick={downloadPDF}>
                  📄 Download PDF
                </button>
                <button className="btn-print" onClick={() => window.print()}>
                  🖨️ Print Ticket
                </button>
              </div>
              {emailStatus && (
                <div className={`email-status ${emailStatus.includes('❌') ? 'error' : emailStatus.includes('✅') ? 'success' : 'info'}`}>
                  {emailStatus}
                </div>
              )}
            </div>

            <div className="important-info">
              <h4>Important Information:</h4>
              <ul>
                <li>Check-in opens 48 hours before departure</li>
                <li>Please arrive at the airport at least 2 hours before domestic flights</li>
                <li>Carry a valid ID proof matching the passenger name</li>
                <li>Web check-in is available on our website and mobile app</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="confirmation-actions">
          <button className="btn-view-bookings" onClick={() => { onClose(); window.location.hash = '#bookings'; }}>
            📋 View My Bookings
          </button>
          <button className="btn-download" onClick={onClose}>
            ✓ Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmation;
