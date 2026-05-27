import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import "./components/BookingComponents.css";

import FlightPanel from "./components/FlightPanel";
import WeatherPanel from "./components/WeatherPanel";
import MyBookings from "./components/MyBookings";
import LoginModal from "./components/LoginModal";
import BookingConfirmation from "./components/BookingConfirmation";
import BookingFlow from "./components/BookingFlow";
import FlightMap from "./components/FlightMap";
import NearbyAirports from "./components/NearbyAirports";
import "./components/FlightTracking.css";

function App() {
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [currentPage, setCurrentPage] = useState("home");
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [lastBooking, setLastBooking] = useState(null);
  const [theme, setTheme] = useState("dark");

  // Search form state
  const [searchForm, setSearchForm] = useState({
    from: "",
    to: "",
    date: "",
    travellers: "1"
  });

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) setTheme(saved);
  }, []);

  // Save theme
  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Fetch bookings on mount and when page changes to bookings
  useEffect(() => {
    if (currentPage === "mytrips") {
      fetchBookings();
    }
  }, [currentPage]);

  const fetchBookings = async () => {
    try {
      const response = await axios.get("http://localhost:8080/bookings");
      setBookings(response.data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    }
  };

  const handleSelectFlight = (flight) => {
    setSelectedFlight(flight);
  };

  const handleBookFlight = async (flightId) => {
    try {
      const bookingData = {
        passengerName: user?.name || "Passenger",
        seatsBooked: 1
      };
      
      const response = await axios.post(`http://localhost:8080/bookings/${flightId}`, bookingData);
      setLastBooking(response.data);
      
      // Refresh bookings list
      fetchBookings();
    } catch (err) {
      alert("Booking failed. Please try again.");
      console.error("Booking error:", err);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleNavigation = (page) => {
    setCurrentPage(page);
    setShowBookingFlow(false);
  };

  const handleStartBooking = () => {
    setShowBookingFlow(true);
  };

  const handleBookingComplete = (booking) => {
    setShowBookingFlow(false);
    // Refresh bookings list
    fetchBookings();
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Start booking flow with search params
    setShowBookingFlow(true);
    setCurrentPage("book");
  };

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="header-brand">
          <span className="brand-icon">✈️</span>
          <h1 className="brand-name">SkyRex Airways</h1>
        </div>

        <nav className="header-nav">
          <button 
            className={`nav-item ${currentPage === 'home' || showBookingFlow ? 'active' : ''}`}
            onClick={() => handleNavigation('home')}
          >
            Book
          </button>
          <button 
            className={`nav-item ${currentPage === 'mytrips' ? 'active' : ''}`}
            onClick={() => handleNavigation('mytrips')}
          >
            My Trips
          </button>
          <button 
            className={`nav-item ${currentPage === 'checkin' ? 'active' : ''}`}
            onClick={() => handleNavigation('checkin')}
          >
            Check-in
          </button>
          <button 
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavigation('dashboard')}
          >
            Track
          </button>
        </nav>

        <div className="header-actions">
          {/* STYLISH TOGGLE SWITCH */}
          <div className="theme-toggle-container">
            <span className={`theme-label ${theme === "light" ? "active" : ""}`}>
              ☀
            </span>
            <label className="theme-switch">
              <input 
                type="checkbox" 
                checked={theme === "dark"}
                onChange={toggleTheme}
                aria-label="Toggle theme"
              />
              <span className="toggle-slider">
                <span className="toggle-icon sun">☀</span>
                <span className="toggle-icon moon">🌙</span>
              </span>
            </label>
            <span className={`theme-label ${theme === "dark" ? "active" : ""}`}>
              🌙
            </span>
          </div>

          {user ? (
            <div className="user-info">
              <span className="user-name">{user.name || user.email}</span>
              <button className="btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <button 
              className="btn-login"
              onClick={() => setIsLoginOpen(true)}
            >
              Login
            </button>
          )}
        </div>
      </header>

      <main className="main-content">
        {/* HOME PAGE - BOOKING SEARCH */}
        {currentPage === 'home' && !showBookingFlow && (
          <HomePage 
            searchForm={searchForm}
            onSearchChange={handleSearchChange}
            onSearchSubmit={handleSearchSubmit}
          />
        )}

        {/* BOOK PAGE / BOOKING FLOW */}
        {(currentPage === 'book' || showBookingFlow) && (
          <BookingFlow 
            onBookingComplete={handleBookingComplete}
            user={user}
          />
        )}

        {/* MY TRIPS PAGE */}
        {currentPage === 'mytrips' && (
          <MyBookings />
        )}

        {/* CHECK-IN PAGE */}
        {currentPage === 'checkin' && (
          <CheckInPage />
        )}

        {/* TRACK PAGE (DASHBOARD) */}
        {currentPage === 'dashboard' && (
          <div className="tracking-dashboard">
            {/* Top Row - Flight List + Weather */}
            <div className="dashboard-row">
              <div className="tracking-panel">
                <div className="panel-header">
                  <h2>🛫 Flight Status</h2>
                </div>
                <div className="panel-body">
                  <FlightPanel 
                    onSelectFlight={handleSelectFlight}
                    onBookFlight={handleBookFlight}
                  />
                </div>
              </div>
              <div className="tracking-panel">
                <div className="panel-header">
                  <h2>🌤️ Weather Forecast</h2>
                </div>
                <div className="panel-body">
                  <WeatherPanel selectedFlight={selectedFlight} />
                </div>
              </div>
            </div>

            {/* Middle Row - Flight Map */}
            <div className="dashboard-full">
              <div className="tracking-panel">
                <div className="panel-header">
                  <h2>🗺️ Live Flight Tracking</h2>
                  {selectedFlight && (
                    <div className="live-indicator">
                      <span className="live-dot"></span>
                      TRACKING {selectedFlight.flightNumber}
                    </div>
                  )}
                </div>
                <div className="panel-body">
                  <FlightMap selectedFlight={selectedFlight} height="480px" />
                </div>
              </div>
            </div>

            {/* Bottom Row - Nearby Airports */}
            <div className="dashboard-full">
              <NearbyAirports />
            </div>

            {/* Quick Stats Section */}
            <section className="stats-section">
              <div className="stats-container">
                <div className="stat-card">
                  <div className="stat-icon">✈️</div>
                  <div className="stat-info">
                    <span className="stat-number">150+</span>
                    <span className="stat-label">Daily Flights</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🌍</div>
                  <div className="stat-info">
                    <span className="stat-number">50+</span>
                    <span className="stat-label">Destinations</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">😊</div>
                  <div className="stat-info">
                    <span className="stat-number">10K+</span>
                    <span className="stat-label">Happy Customers</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⏱</div>
                  <div className="stat-info">
                    <span className="stat-number">95%</span>
                    <span className="stat-label">On-Time Performance</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>SkyRex Airways</h4>
            <p>India's leading airline with on-time performance. Fly smart, fly with SkyRex.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#about">About Us</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><a href="#help">Help Center</a></li>
              <li><a href="#refund">Refund Policy</a></li>
              <li><a href="#terms">Terms & Conditions</a></li>
            </ul>
          </div>
          
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 SkyRex Airways. All rights reserved.</p>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
      />

      {lastBooking && (
        <BookingConfirmation 
          booking={lastBooking}
          onClose={() => setLastBooking(null)}
        />
      )}
    </div>
  );
}

// Home Page Component with Search Box
function HomePage({ searchForm, onSearchChange, onSearchSubmit }) {
  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="home-title">Where would you like to fly? ✈️</h1>
        <p className="home-subtitle">Discover amazing destinations with SkyRex Airways</p>
      </div>

      <div className="search-box">
        <form onSubmit={onSearchSubmit}>
          <div className="search-row">
            <div className="search-field">
              <label>From</label>
              <input
                type="text"
                name="from"
                value={searchForm.from}
                onChange={onSearchChange}
                placeholder="Departure city"
                required
              />
            </div>
            <div className="search-field">
              <label>To</label>
              <input
                type="text"
                name="to"
                value={searchForm.to}
                onChange={onSearchChange}
                placeholder="Destination city"
                required
              />
            </div>
            <div className="search-field">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={searchForm.date}
                onChange={onSearchChange}
                required
              />
            </div>
            <div className="search-field">
              <label>Travellers</label>
              <input
                type="number"
                name="travellers"
                value={searchForm.travellers}
                onChange={onSearchChange}
                placeholder="Number of travellers"
                min="1"
                max="9"
              />
            </div>
            <button type="submit" className="search-btn">
              Search Flights
            </button>
          </div>
        </form>
      </div>

      {/* Features Section */}
      <div className="home-features">
        <div className="feature-card">
          <div className="feature-icon">✈️</div>
          <h3>Easy Booking</h3>
          <p>Book your flights in just a few clicks</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🛡️</div>
          <h3>Safe Travel</h3>
          <p>Your safety is our top priority</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💰</div>
          <h3>Best Prices</h3>
          <p>Competitive fares with no hidden fees</p>
        </div>
      </div>
    </div>
  );
}

// Check-In Page Component
function CheckInPage() {
  const [pnr, setPnr] = useState('');
  const [email, setEmail] = useState('');
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setError('');
    setBooking(null);

    if (!pnr && !email) {
      setError('Please enter PNR or Email');
      return;
    }

    setIsLoading(true);

    try {
      // Search by PNR or email
      const response = await axios.get('http://localhost:8080/bookings');
      const found = response.data.find(b => 
        b.id.toString() === pnr || 
        `IND${b.id.toString().padStart(8, '0')}` === pnr.toUpperCase() ||
        b.passengerEmail === email
      );

      if (found) {
        setBooking(found);
      } else {
        setError('Booking not found. Please check your PNR or Email.');
      }
    } catch (err) {
      setError('Failed to fetch booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBoardingPass = () => {
    window.print();
  };

  return (
    <div className="checkin-page">
      <div className="checkin-header">
        <h1>🛂 Online Check-in</h1>
        <p>Check-in for your flight and download your boarding pass</p>
      </div>

      <div className="checkin-form-container">
        <form onSubmit={handleCheckIn} className="checkin-form">
          <div className="form-group">
            <label>PNR Number</label>
            <input
              type="text"
              value={pnr}
              onChange={(e) => setPnr(e.target.value.toUpperCase())}
              placeholder="Enter your PNR (e.g., IND12345678)"
              maxLength="11"
            />
          </div>
          <div className="form-divider">
            <span>OR</span>
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your booking email"
            />
          </div>
          <button 
            type="submit" 
            className="btn-checkin-submit"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Find Booking'}
          </button>
        </form>

        {error && (
          <div className="error-message checkin-error">
            ❌ {error}
          </div>
        )}

        {booking && (
          <div className="booking-found">
            <h3>✅ Booking Found!</h3>
            <div className="booking-summary-card">
              <div className="summary-row">
                <span className="label">PNR:</span>
                <span className="value">IND{booking.id.toString().padStart(8, '0')}</span>
              </div>
              <div className="summary-row">
                <span className="label">Passenger:</span>
                <span className="value">{booking.passengerName}</span>
              </div>
              <div className="summary-row">
                <span className="label">Flight:</span>
                <span className="value">{booking.flight?.flightNumber}</span>
              </div>
              <div className="summary-row">
                <span className="label">Route:</span>
                <span className="value">{booking.flight?.source} → {booking.flight?.destination}</span>
              </div>
              <div className="summary-row">
                <span className="label">Date:</span>
                <span className="value">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
            <button 
              className="btn-download-boarding"
              onClick={downloadBoardingPass}
            >
              📥 Download Boarding Pass
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;