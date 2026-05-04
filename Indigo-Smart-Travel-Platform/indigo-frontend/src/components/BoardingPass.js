import React from "react";
import { normalizeSeats } from "../utils/seatUtils";

function BoardingPass({ booking, onClose }) {
  if (!booking || !booking.id) return null;

  const bookingId = `IND${booking.id.toString().padStart(8, '0')}`;
  const boardingTime = booking.flight?.departureTime || '06:00';
  const gate = `G${Math.floor(Math.random() * 20) + 1}`;
  const seatNumbers = normalizeSeats(booking.selectedSeats);
  const passengerName = booking.passengerName || 'Passenger';
  const seatsBooked = booking.seatsBooked || 1;

  // Generate a simple QR code-like pattern
  const QRCode = () => {
    const cells = [];
    const size = 12;
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        // Create a pattern based on booking ID
        const isBlack = (bookingId.charCodeAt(i % bookingId.length) + j) % 3 === 0;
        cells.push(
          <div 
            key={`${i}-${j}`} 
            className={`qr-cell ${isBlack ? 'black' : 'white'}`}
          />
        );
      }
    }
    
    return (
      <div className="qr-code">
        {cells}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content boarding-pass-modal" onClick={(e) => e.stopPropagation()}>
        <div className="boarding-pass">
          {/* Header */}
          <div className="pass-header">
            <div className="airline-logo">
              <span className="logo-text">SkyRex</span>
              <span className="tagline">Fly Smart</span>
            </div>
            <div className="pass-type">BOARDING PASS</div>
          </div>

          {/* Main Content */}
          <div className="pass-content">
            {/* Left Section */}
            <div className="pass-section left-section">
              <div className="section-row">
                <div className="info-group">
                  <span className="info-label">PASSENGER</span>
                  <span className="info-value passenger-name">{passengerName}</span>
                </div>
              </div>

              <div className="section-row">
                <div className="info-group">
                  <span className="info-label">FROM</span>
                  <span className="info-value city">{booking.flight?.source}</span>
                </div>
                <div className="info-group">
                  <span className="info-label">TO</span>
                  <span className="info-value city">{booking.flight?.destination}</span>
                </div>
              </div>

              <div className="section-row">
                <div className="info-group flight-number-group">
                  <span className="info-label">FLIGHT</span>
                  <span className="info-value flight-number">{booking.flight?.flightNumber}</span>
                </div>
              </div>

              <div className="section-row">
                <div className="info-group">
                  <span className="info-label">DATE</span>
                  <span className="info-value date">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="info-group">
                  <span className="info-label">BOARDING</span>
                  <span className="info-value time">{boardingTime}</span>
                </div>
                <div className="info-group">
                  <span className="info-label">GATE</span>
                  <span className="info-value gate">{gate}</span>
                </div>
              </div>

              <div className="section-row">
                <div className="info-group">
                  <span className="info-label">SEAT</span>
                  <span className="info-value seat">{seatNumbers.join(', ')}</span>
                </div>
                <div className="info-group">
                  <span className="info-label">CLASS</span>
                  <span className="info-value class">Economy</span>
                </div>
                <div className="info-group">
                  <span className="info-label">SEATS</span>
                  <span className="info-value seats">{seatsBooked}</span>
                </div>
              </div>
            </div>

            {/* Right Section with QR Code */}
            <div className="pass-section right-section">
              <div className="qr-section">
                <QRCode />
                <div className="qr-booking-id">{bookingId}</div>
              </div>

              <div className="barcode-section">
                <div className="barcode">
                  {bookingId.split('').map((char, index) => (
                    <div 
                      key={index} 
                      className="barcode-line"
                      style={{ 
                        width: char.charCodeAt(0) % 3 + 1 + 'px',
                        marginRight: '2px'
                      }}
                    />
                  ))}
                </div>
                <div className="barcode-number">{bookingId}</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pass-footer">
            <div className="footer-info">
              <span>Please arrive at the gate at least 30 minutes before departure</span>
            </div>
            <div className="footer-details">
              <span>E-Ticket</span>
              <span>•</span>
              <span>Non-Transferable</span>
            </div>
          </div>

          {/* Perforation Line */}
          <div className="perforation">
            <span>✂</span>
            <span>Detach here</span>
            <span>✂</span>
          </div>

          {/* Stub (for printing) */}
          <div className="pass-stub">
            <div className="stub-section">
              <div className="stub-info">
                <span className="stub-label">Name</span>
                <span className="stub-value">{passengerName}</span>
              </div>
              <div className="stub-info">
                <span className="stub-label">From</span>
                <span className="stub-value">{booking.flight?.source}</span>
              </div>
              <div className="stub-info">
                <span className="stub-label">To</span>
                <span className="stub-value">{booking.flight?.destination}</span>
              </div>
              <div className="stub-info">
                <span className="stub-label">Flight</span>
                <span className="stub-value">{booking.flight?.flightNumber}</span>
              </div>
              <div className="stub-info">
                <span className="stub-label">Date</span>
                <span className="stub-value">{new Date().toLocaleDateString()}</span>
              </div>
              <div className="stub-info">
                <span className="stub-label">Seat</span>
                <span className="stub-value seat">{seatNumbers.join(', ')}</span>
              </div>
            </div>
            <div className="stub-qr">
              <div className="small-qr">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="qr-row">
                    {Array.from({ length: 6 }).map((_, j) => {
                      const isBlack = (bookingId.charCodeAt(i % bookingId.length) + j) % 3 === 0;
                      return <div key={j} className={`qr-cell ${isBlack ? 'black' : 'white'}`} />;
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pass-actions">
          <button className="btn-print" onClick={() => window.print()}>
            🖨️ Print Boarding Pass
          </button>
          <button className="btn-download" onClick={onClose}>
            ✓ Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default BoardingPass;