import React, { useState, useEffect, useRef } from "react";
import { wsService } from "../utils/websocketService";

function SeatSelection({ flight, passengers, onConfirmSelection, onCancel }) {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState([]);
  const [otherUsersSelections, setOtherUsersSelections] = useState(new Set());
  const unsubscribeRef = useRef(null);
  const userIdRef = useRef('user-' + Math.random().toString(36).substr(2, 9));

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

  // Initialize available seats and WebSocket connection
  useEffect(() => {
    if (!flight) return;

    // Generate initial seat layout
    const layout = generateSeatLayout(flight?.availableSeats || 60);
    const allSeatIds = layout.flat().map(seat => seat.id);
    setAvailableSeats(allSeatIds);

    // Initialize WebSocket connection for real-time seat updates
    const initWebSocket = async () => {
      try {
        await wsService.connect();
        setWsConnected(true);
        console.log('WebSocket connected for flight:', flight.id);

        // Subscribe to seat updates for this specific flight
        const destination = `/topic/seats/${flight.id}`;
        unsubscribeRef.current = wsService.subscribe(destination, (message) => {
          handleSeatUpdate(message);
        });

        // Send sync request to get current seat state
        wsService.send(`/app/seat/sync/${flight.id}`, {
          flightId: flight.id,
          userId: userIdRef.current
        });
      } catch (error) {
        console.warn('WebSocket connection failed, operating in offline mode:', error);
        setWsConnected(false);
      }
    };

    initWebSocket();

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      // Release our selections if user leaves without confirming
      if (selectedSeats.length > 0 && flight?.id) {
        wsService.send(`/app/seat/release/${flight.id}`, {
          flightId: flight.id,
          selectedSeats: selectedSeats,
          userId: userIdRef.current
        });
      }
    };
  }, [flight?.id]);

  // Handle incoming real-time seat updates
  const handleSeatUpdate = (message) => {
    setRealTimeUpdates(prev => [...prev.slice(-4), message]);

    switch (message.action) {
      case 'SELECT':
        // Another user selected seats - add to blocked set if not ours
        if (message.userId !== userIdRef.current && message.selectedSeats) {
          setOtherUsersSelections(prev => {
            const newSet = new Set(prev);
            message.selectedSeats.forEach(seat => newSet.add(seat));
            return newSet;
          });
        }
        break;

      case 'DESELECT':
        // Another user deselected seats
        if (message.userId !== userIdRef.current && message.selectedSeats) {
          setOtherUsersSelections(prev => {
            const newSet = new Set(prev);
            message.selectedSeats.forEach(seat => newSet.delete(seat));
            return newSet;
          });
        }
        break;

      case 'CONFIRM':
        // Seats confirmed by someone - permanently remove from available
        if (message.selectedSeats) {
          setAvailableSeats(prev => prev.filter(seat => !message.selectedSeats.includes(seat)));
          setOtherUsersSelections(prev => {
            const newSet = new Set(prev);
            message.selectedSeats.forEach(seat => newSet.delete(seat));
            return newSet;
          });
        }
        break;

      case 'RELEASE':
        // Seats released - make available again
        if (message.selectedSeats) {
          setOtherUsersSelections(prev => {
            const newSet = new Set(prev);
            message.selectedSeats.forEach(seat => newSet.delete(seat));
            return newSet;
          });
        }
        break;

      case 'SYNC':
        // Sync current selections from server
        if (message.selectedSeats) {
          setOtherUsersSelections(new Set(message.selectedSeats));
        }
        break;

      default:
        break;
    }
  };

  const totalRequiredSeats = passengers.reduce((sum, p) => sum + (parseInt(p.seatCount) || 0), 0);

  const handleSeatClick = (seat) => {
    // Prevent selecting seats blocked by other users
    if (otherUsersSelections.has(seat.id)) return;

    if (selectedSeats.includes(seat.id)) {
      // Deselect seat
      const newSelected = selectedSeats.filter(id => id !== seat.id);
      setSelectedSeats(newSelected);

      // Notify server about deselection
      if (wsConnected && flight?.id) {
        wsService.send(`/app/seat/deselect/${flight.id}`, {
          flightId: flight.id,
          selectedSeats: [seat.id],
          userId: userIdRef.current
        });
      }
    } else if (selectedSeats.length < totalRequiredSeats) {
      // Select seat
      const newSelected = [...selectedSeats, seat.id];
      setSelectedSeats(newSelected);

      // Notify server about selection
      if (wsConnected && flight?.id) {
        wsService.send(`/app/seat/select/${flight.id}`, {
          flightId: flight.id,
          selectedSeats: [seat.id],
          userId: userIdRef.current
        });
      }
    }
  };

  const confirmSelection = async () => {
    if (selectedSeats.length !== totalRequiredSeats) {
      alert(`Please select exactly ${totalRequiredSeats} seats`);
      return;
    }

    setIsConfirming(true);
    try {
      // Notify server about seat confirmation
      if (wsConnected && flight?.id) {
        wsService.send(`/app/seat/confirm/${flight.id}`, {
          flightId: flight.id,
          selectedSeats: selectedSeats,
          userId: userIdRef.current
        });
      }

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

    if (!availableSeats.includes(seat.id) || otherUsersSelections.has(seat.id)) {
      classes.push('unavailable');
    } else if (selectedSeats.includes(seat.id)) {
      classes.push('selected');
    } else {
      classes.push('available');
    }

    if (seat.isWindow) classes.push('window');
    if (seat.isAisle) classes.push('aisle');
    if (otherUsersSelections.has(seat.id)) classes.push('reserved-by-other');

    return classes.join(' ');
  };

  const getSeatTooltip = (seat) => {
    if (otherUsersSelections.has(seat.id)) return `${seat.id} - Currently being selected by another user`;
    if (!availableSeats.includes(seat.id)) return `${seat.id} - Already booked`;
    if (selectedSeats.includes(seat.id)) return `${seat.id} - Your selection`;
    return `${seat.id} - Available`;
  };

  const seatLayout = generateSeatLayout(flight?.availableSeats || 60);

  return (
    <div className="seat-selection-panel">
      <div className="selection-header">
        <h2>Seat Selection</h2>
        <div className="header-status">
          <p>Select {totalRequiredSeats} seat(s) for your journey</p>
          {wsConnected ? (
            <span className="ws-status connected" title="Real-time updates active">
              <span className="ws-dot"></span> Live Updates
            </span>
          ) : (
            <span className="ws-status disconnected" title="Real-time updates unavailable">
              <span className="ws-dot"></span> Offline Mode
            </span>
          )}
        </div>
      </div>

      {/* Real-time activity feed */}
      {realTimeUpdates.length > 0 && (
        <div className="activity-feed">
          <div className="activity-feed-header">Recent Activity</div>
          <div className="activity-items">
            {realTimeUpdates.slice(-3).map((update, index) => (
              <div key={index} className={`activity-item ${update.action.toLowerCase()}`}>
                <span className="activity-icon">
                  {update.action === 'SELECT' ? '👤' :
                   update.action === 'CONFIRM' ? '✅' :
                   update.action === 'DESELECT' ? '❌' : '🔄'}
                </span>
                <span className="activity-text">
                  {update.action === 'SELECT' ? `Seat ${update.selectedSeats?.[0]} selected` :
                   update.action === 'CONFIRM' ? `${update.selectedSeats?.length} seat(s) booked` :
                   update.action === 'DESELECT' ? `Seat ${update.selectedSeats?.[0]} released` :
                   'Syncing seats...'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
                  disabled={!availableSeats.includes(seat.id) || otherUsersSelections.has(seat.id)}
                  title={getSeatTooltip(seat)}
                >
                  <div className="seat-number">{seat.id}</div>
                  <div className="seat-indicators">
                    {seat.isWindow && <span className="indicator window-indicator">W</span>}
                    {seat.isAisle && <span className="indicator aisle-indicator">A</span>}
                    {otherUsersSelections.has(seat.id) && (
                      <span className="indicator busy-indicator">🔒</span>
                    )}
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
            <span>Booked</span>
          </div>
          <div className="legend-item">
            <span className="seat sample reserved-by-other"></span>
            <span>In Selection</span>
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
