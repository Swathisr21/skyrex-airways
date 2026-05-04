import React, { useState, useEffect } from "react";
import FlightSearch from "./FlightSearch";
import PassengerForm from "./PassengerForm";
import SeatSelection from "./SeatSelection";
import BoardingPass from "./BoardingPass";
import axios from "axios";

function BookingFlow({ onBookingComplete, user, initialSearch }) {
  const [step, setStep] = useState(initialSearch?.from && initialSearch?.to ? 'results' : 'search');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [seatSelection, setSeatSelection] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchData, setSearchData] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);

  // Auto-trigger search if initialSearch is provided
  useEffect(() => {
    if (initialSearch?.from && initialSearch?.to && step === 'results') {
      handleFlightSearch({
        source: initialSearch.from,
        destination: initialSearch.to,
        date: initialSearch.date || new Date().toISOString().split('T')[0]
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSearch]);

  const handleFlightSearch = async (searchDataInput) => {
    setIsLoading(true);
    setError(null);
    setSearchData(searchDataInput);
    
    try {
      const params = new URLSearchParams();
      if (searchDataInput.source) params.append('source', searchDataInput.source);
      if (searchDataInput.destination) params.append('destination', searchDataInput.destination);

      const formattedDate = new Date(searchDataInput.date).toISOString().split("T")[0];
      params.append('travelDate', formattedDate);

      const response = await axios.get(`http://localhost:8080/flights?${params.toString()}`);
      let flights = response.data;

      console.log("API Response:", flights);

      setSearchResults(flights);
      setStep('results');
    } catch (err) {
      setError("Failed to fetch flights. Please try again.");
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFlight = (flight) => {
    if (flight.availableSeats > 0) {
      setSelectedFlight(flight);
      setTotalAmount(flight.price);
      setStep('passenger');
    }
  };

  const handlePassengerSubmit = (passengerData) => {
    setPassengers(passengerData);
    const totalSeats = passengerData.reduce((sum, p) => sum + (parseInt(p.seatCount) || 0), 0);
    setTotalAmount(selectedFlight.price * totalSeats);
    setStep('seat');
  };

  const handleSeatConfirmation = async (seatData) => {
    setSeatSelection(seatData);
    setStep('payment');
  };

  const handleCouponApply = async () => {

  if (!couponCode.trim()) return;

  try {

    const response = await axios.get(
      "http://localhost:8080/coupons"
    );

    const coupons = response.data;

    const matchedCoupon = coupons.find(
      c => c.code.toUpperCase() === couponCode.toUpperCase()
    );

    if (!matchedCoupon) {

      alert("Invalid Coupon");

      return;
    }

    const discountAmount =
     totalAmount * (matchedCoupon.discountPercentage / 100);

    const newTotal =
  totalAmount - discountAmount;

setDiscount(discountAmount);

setTotalAmount(newTotal);

    alert("Coupon Applied Successfully!");

  } catch (err) {

    console.error("Coupon apply failed:", err);

    alert("Failed to apply coupon");
  }
};

  const handlePayment = async (paymentMethod) => {
    setIsLoading(true);
    
    try {
      const totalSeats = passengers.reduce((sum, p) => sum + (parseInt(p.seatCount) || 0), 0);
      const bookingPayload = {
        passengerName: passengers.map(p => p.name).join(', '),
        seatsBooked: totalSeats,
        selectedSeats: seatSelection.selectedSeats.join(', '),
        status: "CONFIRMED"
      };

      const bookingResponse = await axios.post(
        `http://localhost:8080/bookings/${selectedFlight.id}`, 
        bookingPayload
      );

      const paymentResponse = await axios.post("http://localhost:8080/payments/create", {
        bookingId: bookingResponse.data.id,
        amount: totalAmount - discount,
        paymentMethod: paymentMethod
      });

      await axios.post(`http://localhost:8080/payments/${paymentResponse.data.paymentId}/process`, {
        success: true
      });

      try {
        await axios.post("http://localhost:8080/checkin/create", {
          bookingId: bookingResponse.data.id,
          gateNumber: "A" + Math.floor(Math.random() * 10) + 1,
          boardingTime: selectedFlight.departureTime
        });
      } catch (e) {
        // Check-in creation is optional
      }

      setBookingData({
        ...bookingResponse.data,
        passengers,
        selectedSeats: seatSelection.selectedSeats,
        payment: paymentResponse.data,
        discount: discount
      });

      setStep('boarding');
    } catch (err) {
      setError("Failed to complete booking. Please try again.");
      console.error("Booking error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingComplete = () => {
    if (onBookingComplete) {
      onBookingComplete(bookingData);
    }
    resetFlow();
  };

  const resetFlow = () => {
    setStep('search');
    setSearchResults([]);
    setSelectedFlight(null);
    setPassengers([]);
    setSeatSelection(null);
    setBookingData(null);
    setPaymentData(null);
    setTotalAmount(0);
    setDiscount(0);
    setCouponCode("");
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel the booking process?')) {
      resetFlow();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'search':
        return (
          <div className="booking-flow-container">
            <FlightSearch 
              onSearch={handleFlightSearch}
              isLoading={isLoading}
            />
          </div>
        );

      case 'results':
        return (
          <div className="booking-flow-container">
            <div className="search-results-header">
              <h2>Available Flights</h2>
              {searchData && (
                <div className="search-summary">
                  {searchData.source} → {searchData.destination} | {searchData.date}
                </div>
              )}
              <button className="new-search-btn" onClick={() => setStep('search')}>
                New Search
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="no-results">
                <div className="no-results-icon">✈️</div>
                <h3>No Flights Found</h3>
                <p>No flights available for your search criteria. Try different cities or dates.</p>
                <button className="retry-search-btn" onClick={() => setStep('search')}>
                  Try New Search
                </button>
              </div>
            ) : (
              <div className="search-results-grid">
                {searchResults.map(flight => (
                  <div key={flight.id} className="flight-result-card">
                    <div className="flight-header">
                      <h3>{flight.flightNumber}</h3>
                      <span className={`availability ${flight.availableSeats > 0 ? 'available' : 'sold-out'}`}>
                        {flight.availableSeats > 0 ? `${flight.availableSeats} seats left` : 'Sold Out'}
                      </span>
                    </div>
                    
                    <div className="flight-route">
                      <div className="route-info">
                        <span className="city">{flight.source}</span>
                        <span className="arrow">→</span>
                        <span className="city">{flight.destination}</span>
                      </div>
                    </div>

                    <div className="flight-times">
                      <div className="time-block">
                        <span className="time-label">Departure</span>
                        <span className="time-value">{flight.departureTime}</span>
                      </div>
                      <div className="time-block">
                        <span className="time-label">Arrival</span>
                        <span className="time-value">{flight.arrivalTime}</span>
                      </div>
                    </div>

                    <div className="flight-details">
                      <div className="detail">
                        <span className="detail-label">Price</span>
                        <span className="price">₹{flight.price}</span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Duration</span>
                        <span className="duration">~2h 30m</span>
                      </div>
                      <div className="detail">
                        <span className="detail-label">Airline</span>
                        <span className="airline">{flight.airline || 'Indigo'}</span>
                      </div>
                    </div>

                    <button 
                      className="select-flight-btn"
                      onClick={() => handleSelectFlight(flight)}
                      disabled={flight.availableSeats === 0}
                    >
                      Select Flight
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'passenger':
        return (
          <div className="booking-flow-container">
            <PassengerForm 
              onSubmit={handlePassengerSubmit}
              onCancel={handleCancel}
            />
          </div>
        );

      case 'seat':
        return (
          <div className="booking-flow-container">
            <SeatSelection 
              flight={selectedFlight}
              passengers={passengers}
              onConfirmSelection={handleSeatConfirmation}
              onCancel={handleCancel}
            />
          </div>
        );

      case 'payment':
        return (
          <div className="booking-flow-container">
            <div className="payment-section">
              <h2>Payment</h2>
              
              <div className="booking-summary">
                <h3>Booking Summary</h3>
                <div className="summary-row">
                  <span>Flight:</span>
                  <span>{selectedFlight?.flightNumber} ({selectedFlight?.source} → {selectedFlight?.destination})</span>
                </div>
                <div className="summary-row">
                  <span>Passengers:</span>
                  <span>{passengers.map(p => p.name).join(', ')}</span>
                </div>
                <div className="summary-row">
                  <span>Seats:</span>
                  <span>{seatSelection?.selectedSeats?.join(', ')}</span>
                </div>
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>₹{totalAmount + discount}</span>
                </div>
                {discount > 0 && (
                  <div className="summary-row discount">
                    <span>Discount:</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>

              <div className="coupon-section">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="coupon-input"
                />
                <button
  onClick={handleCouponApply}
>
  Apply
</button>
              </div>

              <div className="payment-methods">
                <h3>Select Payment Method</h3>
                <div className="payment-options">
                  <button 
                    className="payment-option"
                    onClick={() => handlePayment('CREDIT_CARD')}
                    disabled={isLoading}
                  >
                    💳 Credit Card
                  </button>
                  <button 
                    className="payment-option"
                    onClick={() => handlePayment('DEBIT_CARD')}
                    disabled={isLoading}
                  >
                    💳 Debit Card
                  </button>
                  <button 
                    className="payment-option"
                    onClick={() => handlePayment('UPI')}
                    disabled={isLoading}
                  >
                    📱 UPI
                  </button>
                  <button 
                    className="payment-option"
                    onClick={() => handlePayment('NETBANKING')}
                    disabled={isLoading}
                  >
                    🏦 Net Banking
                  </button>
                </div>
              </div>

              {isLoading && (
                <div className="loading-overlay">
                  <div className="spinner"></div>
                  <p>Processing payment...</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'boarding':
        return (
          <div className="booking-flow-container">
            <BoardingPass 
              booking={bookingData}
              onClose={handleBookingComplete}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Show progress indicator
  const getProgressSteps = () => {
    const steps = [
      { id: 'search', label: 'Search', icon: '🔍' },
      { id: 'results', label: 'Flights', icon: '✈️' },
      { id: 'passenger', label: 'Details', icon: '👤' },
      { id: 'seat', label: 'Seats', icon: '💺' },
      { id: 'payment', label: 'Payment', icon: '💳' },
      { id: 'boarding', label: 'Boarding', icon: '🎫' }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === step);

    return (
      <div className="booking-progress">
        {steps.map((s, index) => (
          <div 
            key={s.id} 
            className={`progress-step ${index <= currentStepIndex ? 'active' : ''} ${index === currentStepIndex ? 'current' : ''}`}
          >
            <div className="step-icon">{s.icon}</div>
            <div className="step-label">{s.label}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="booking-flow">
      {getProgressSteps()}
      
      <div className="flow-content">
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}
        
        {renderStep()}
      </div>
    </div>
  );
}

export default BookingFlow;
