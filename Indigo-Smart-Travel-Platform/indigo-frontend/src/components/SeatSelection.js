import React, { useState, useEffect } from "react";

function SeatSelection({ flight, passengers, onConfirmSelection, onCancel }) {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [isConfirming, setIsConfirming] = useState(false);

  // Generate seat layout based on flight capacity
  const generateSeatLayout = (totalSeats) => {
    const layout = [];
    const rows = Math.ceil(totalSeats / 6); // 6 seats per row (3-3 configuration)
    
    let seatNumber = 1;
    for (let row = 1; row <= rows; row++) {
      const rowSeats = [];
      for (let col = 0; col < 6; col++) {
        if (seatNumber <= totalSeats) {
          const seatId = `${String.fromCharCode(65 + Math.floor(col / 3))}${row}${col % 3 + 1}`;
          rowSeats.push({
            id: seatId,
            number: seatNumber,
            isAvailable: true,
            isWindow: col === 0 || col === 5,
            isAisle: col === 2 || col === 3
          });
          seatNumber++;
        }
      }
      layout.push(rowSeats);
    }
    return layout;
  };

  const totalRequiredSeats = passengers.reduce((sum, p) => sum + (parseInt(p.seatCount) || 0), 0);

  const handleSeatClick = (seat) => {
    if (!seat.isAvailable) return;

    if (selectedSeats.includes(seat.id)) {
      // Deselect seat
      setSelectedSeats(prev => prev.filter(id => id !== seat.id));
    } else if (selectedSeats.length < totalRequiredSeats) {
      // Select seat
      setSelectedSeats(prev => [...prev, seat.id]);
    }
  };

  const confirmSelection = async () => {
    if (selectedSeats.length !== totalRequiredSeats) {
      alert(`Please select exactly ${totalRequiredSeats} seats`);
      return;
    }

    setIsConfirming(true);
    try {
      // Here you would typically call your backend to reserve these seats
      // For now, we'll just pass the selection to the parent
      onConfirmSelection({
        selectedSeats,
        passengers
      });
    } catch (error) {
      console.error('Error confirming seats:', error);
      alert('Failed to confirm seat selection. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  const getSeatClass = (seat) => {
    let classes = ['seat'];
    
    if (!seat.isAvailable) {
      classes.push('unavailable');
    } else if (selectedSeats.includes(seat.id)) {
      classes.push('selected');
    } else {
      classes.push('available');
    }

    if (seat.isWindow) classes.push('window');
    if (seat.isAisle) classes.push('aisle');

    return classes.join(' ');
  };

  const seatLayout = generateSeatLayout(flight?.availableSeats || 60);

  return (
    <div className="seat-selection-panel">
      <div className="selection-header">
        <h2>Seat Selection</h2>
        <p>Select {totalRequiredSeats} seat(s) for your journey</p>
      </div>

      <div className="selection-info">
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Flight:</span>
            <span className="value">{flight?.flightNumber}</span>
          </div>
          <div className="info-item">
            <span className="label">Route:</span>
            <span className="value">{flight?.source} → {flight?.destination}</span>
          </div>
          <div className="info-item">
            <span className="label">Selected:</span>
            <span className="value selected-count">
              {selectedSeats.length} / {totalRequiredSeats}
            </span>
          </div>
        </div>
      </div>

      <div className="seat-map-container">
        <div className="cabin-label">Economy Class</div>
        
        <div className="seat-map">
          {seatLayout.map((row, rowIndex) => (
            <div key={rowIndex} className="seat-row">
              {row.map((seat, seatIndex) => (
                <button
                  key={seat.id}
                  className={getSeatClass(seat)}
                  onClick={() => handleSeatClick(seat)}
                  disabled={!seat.isAvailable}
                  title={`${seat.id} - ${seat.isAvailable ? 'Available' : 'Unavailable'}`}
                >
                  <div className="seat-number">{seat.id}</div>
                  <div className="seat-indicators">
                    {seat.isWindow && <span className="indicator window-indicator">W</span>}
                    {seat.isAisle && <span className="indicator aisle-indicator">A</span>}
                  </div>
                </button>
              ))}
              {/* Aisle gap */}
              <div className="aisle-gap"></div>
              {row.map((seat, seatIndex) => (
                <button
                  key={`${seat.id}-right`}
                  className={getSeatClass(seat)}
                  onClick={() => handleSeatClick(seat)}
                  disabled={!seat.isAvailable}
                  title={`${seat.id} - ${seat.isAvailable ? 'Available' : 'Unavailable'}`}
                >
                  <div className="seat-number">{seat.id}</div>
                  <div className="seat-indicators">
                    {seat.isWindow && <span className="indicator window-indicator">W</span>}
                    {seat.isAisle && <span className="indicator aisle-indicator">A</span>}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="legend">
          <div className="legend-item">
            <span className="seat sample available"></span>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <span className="seat sample selected"></span>
            <span>Selected</span>
          </div>
          <div className="legend-item">
            <span className="seat sample unavailable"></span>
            <span>Unavailable</span>
          </div>
          <div className="legend-item">
            <span className="indicator window-indicator">W</span>
            <span>Window</span>
          </div>
          <div className="legend-item">
            <span className="indicator aisle-indicator">A</span>
            <span>Aisle</span>
          </div>
        </div>
      </div>

      <div className="selected-seats-summary">
        <h3>Selected Seats:</h3>
        <div className="selected-list">
          {selectedSeats.length === 0 ? (
            <span className="no-seats">No seats selected</span>
          ) : (
            selectedSeats.map(seatId => (
              <span key={seatId} className="seat-tag">{seatId}</span>
            ))
          )}
        </div>
      </div>

      <div className="selection-actions">
        <button type="button" className="cancel-btn" onClick={onCancel}>
          ← Back
        </button>
        <button 
          type="button" 
          className="confirm-btn"
          onClick={confirmSelection}
          disabled={selectedSeats.length !== totalRequiredSeats || isConfirming}
        >
          {isConfirming ? (
            <>
              <span className="spinner small"></span>
              Confirming...
            </>
          ) : (
            `Confirm ${selectedSeats.length} Seat(s)`
          )}
        </button>
      </div>
    </div>
  );
}

export default SeatSelection;