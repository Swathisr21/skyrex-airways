import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import "./components/BookingComponents.css";

import FlightPanel from "./components/FlightPanel";
import MapPanel from "./components/MapPanel";
import WeatherPanel from "./components/WeatherPanel";
import MyBookings from "./components/MyBookings";
import LoginModal from "./components/LoginModal";
import BookingConfirmation from "./components/BookingConfirmation";
import BookingFlow from "./components/BookingFlow";
import LocationDetector from "./components/LocationDetector";
import NotificationProvider, { NotificationManager } from "./components/NotificationManager";

function App() {
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [currentPage, setCurrentPage] = useState("home");
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [lastBooking, setLastBooking] = useState(null);
  const [theme, setTheme] = useState("light");
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

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

  // PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      if (window.showIndigoToast) {
        window.showIndigoToast('App Installed', 'Indigo Smart Travel is now on your home screen!', 'success', '🎉');
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Fetch bookings
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
      
      // Send notification
      NotificationManager.bookingSuccess({
        ...response.data,
        flightNumber: response.data.flight?.flightNumber || '6E-XXX'
      });
      
      if (window.showIndigoToast) {
        window.showIndigoToast(
          'Booking Confirmed!',
          `Flight booked successfully. PNR: IND${response.data.id?.toString().padStart(8, '0')}`,
          'success',
          '✅'
        );
      }
      
      fetchBookings();
    } catch (err) {
      if (window.showIndigoToast) {
        window.showIndigoToast('Booking Failed', 'Please try again later.', 'error', '❌');
      }
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartBooking = () => {
    setShowBookingFlow(true);
  };

  const handleBookingComplete = (booking) => {
    setShowBookingFlow(false);
    setLastBooking(booking);
    fetchBookings();
    
    // Send success notification
    NotificationManager.bookingSuccess({
      ...booking,
      flightNumber: booking?.flight?.flightNumber || '6E-XXX'
    });
    
    if (window.showIndigoToast) {
      window.showIndigoToast(
        'Booking Complete!',
        'Your flight has been booked successfully.',
        'success',
        '🎉'
      );
    }
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowBookingFlow(true);
    setCurrentPage("book");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectNearbyAirport = (airport) => {
    setSearchForm(prev => ({ ...prev, from: airport.city }));
    if (window.showIndigoToast) {
      window.showIndigoToast('Airport Selected', `${airport.name} set as departure`, 'info', '✈️');
    }
  };

  return (
    <NotificationProvider>
      <div className="app">
        {/* PWA INSTALL BANNER */}
        {showInstallBanner && (
          <div className="install-banner">
            <div className="install-content">
              <span className="install-icon">📲</span>
              <span className="install-text">Install Indigo for quick access</span>
            </div>
            <div className="install-actions">
              <button className="install-btn" onClick={handleInstallPWA}>Install</button>
              <button className="install-dismiss" onClick={() => setShowInstallBanner(false)}>✕</button>
            </div>
          </div>
        )}

        {/* HEADER */}
        <header className="header">
          <div className="header-brand" onClick={() => handleNavigation('home')}>
            <div className="brand-logo">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="8" fill="#0057b8"/>
                <path d="M8 20L14 14L20 20L28 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 20L22 24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="brand-text">
              <h1 className="brand-name">indigo</h1>
              <span className="brand-tagline">Smart Travel</span>
            </div>
          </div>

          <nav className="header-nav">
            <button 
              className={`nav-item ${currentPage === 'home' && !showBookingFlow ? 'active' : ''}`}
              onClick={() => handleNavigation('home')}
            >
              <span className="nav-icon">🔍</span>
              <span className="nav-label">Book</span>
            </button>
            <button 
              className={`nav-item ${currentPage === 'mytrips' ? 'active' : ''}`}
              onClick={() => handleNavigation('mytrips')}
            >
              <span className="nav-icon">🎫</span>
              <span className="nav-label">My Trips</span>
            </button>
            <button 
              className={`nav-item ${currentPage === 'checkin' ? 'active' : ''}`}
              onClick={() => handleNavigation('checkin')}
            >
              <span className="nav-icon">🛂</span>
              <span className="nav-label">Check-in</span>
            </button>
            <button 
              className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavigation('dashboard')}
            >
              <span className="nav-icon">📡</span>
              <span className="nav-label">Track</span>
            </button>
          </nav>

          <div className="header-actions">
            {/* NOTIFICATION TOGGLE */}
            <button 
              className="action-btn notification-btn"
              onClick={() => NotificationManager.requestPermission()}
              title="Enable notifications"
            >
              🔔
            </button>

            {/* THEME TOGGLE */}
            <button className="action-btn theme-btn" onClick={toggleTheme} title="Toggle theme">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {user ? (
              <div className="user-info">
                <div className="user-avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
                <span className="user-name">{user.name || user.email}</span>
                <button className="btn-logout" onClick={handleLogout}>Logout</button>
              </div>
            ) : (
              <button className="btn-login" onClick={() => setIsLoginOpen(true)}>
                Sign In
              </button>
            )}
          </div>
        </header>

        <main className="main-content">
          {/* HOME PAGE - BOOKING-FIRST HERO */}
          {currentPage === 'home' && !showBookingFlow && (
            <HomePage 
              searchForm={searchForm}
              onSearchChange={handleSearchChange}
              onSearchSubmit={handleSearchSubmit}
              onSelectNearbyAirport={handleSelectNearbyAirport}
            />
          )}

          {/* BOOK PAGE / BOOKING FLOW */}
          {(currentPage === 'book' || showBookingFlow) && (
            <BookingFlow 
              onBookingComplete={handleBookingComplete}
              user={user}
              initialSearch={searchForm}
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
            <>
              <div className="dashboard-grid">
                <FlightPanel 
                  onSelectFlight={handleSelectFlight}
                  onBookFlight={handleBookFlight}
                />
                <MapPanel selectedFlight={selectedFlight} />
                <WeatherPanel selectedFlight={selectedFlight} />
              </div>

              <section className="stats-section">
                <div className="stats-container">
                  <div className="stat-card premium">
                    <div className="stat-icon">✈️</div>
                    <div className="stat-info">
                      <span className="stat-number">300+</span>
                      <span className="stat-label">Daily Flights</span>
                    </div>
                  </div>
                  <div className="stat-card premium">
                    <div className="stat-icon">🌍</div>
                    <div className="stat-info">
                      <span className="stat-number">80+</span>
                      <span className="stat-label">Destinations</span>
                    </div>
                  </div>
                  <div className="stat-card premium">
                    <div className="stat-icon">😊</div>
                    <div className="stat-info">
                      <span className="stat-number">100M+</span>
                      <span className="stat-label">Happy Customers</span>
                    </div>
                  </div>
                  <div className="stat-card premium">
                    <div className="stat-icon">⏱</div>
                    <div className="stat-info">
                      <span className="stat-number">99%</span>
                      <span className="stat-label">On-Time Performance</span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>

        {/* FOOTER */}
        <footer className="app-footer">
          <div className="footer-content">
            <div className="footer-section brand">
              <div className="footer-logo">
                <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                  <rect width="36" height="36" rx="8" fill="#0057b8"/>
                  <path d="M8 20L14 14L20 20L28 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>indigo</span>
              </div>
              <p>India's largest and most preferred airline. Fly smart, fly with Indigo.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#about">About Us</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#careers">Careers</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li><a href="#help">Help Center</a></li>
                <li><a href="#refund">Refund Policy</a></li>
                <li><a href="#terms">Terms & Conditions</a></li>
                <li><a href="#privacy">Privacy Policy</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Connect</h4>
              <div className="social-links">
                <a href="#facebook" className="social-link" title="Facebook">f</a>
                <a href="#twitter" className="social-link" title="Twitter">𝕏</a>
                <a href="#instagram" className="social-link" title="Instagram">📷</a>
                <a href="#linkedin" className="social-link" title="LinkedIn">in</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Indigo Airlines. All rights reserved. | goIndigo.in</p>
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
    </NotificationProvider>
  );
}

// ============================================
// HOME PAGE COMPONENT - BOOKING-FIRST PREMIUM
// ============================================
function HomePage({ searchForm, onSearchChange, onSearchSubmit, onSelectNearbyAirport }) {
  const [activeTripType, setActiveTripType] = useState('one-way');

  return (
    <div className="home-page">
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-bg">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="live-pulse"></span>
            India's #1 Airline
          </div>
          <h1 className="hero-title">
            Where would you<br />
            <span className="gradient-text">like to fly today?</span>
          </h1>
          <p className="hero-subtitle">
            Book flights to 80+ destinations with India's most on-time airline
          </p>
        </div>

        {/* PREMIUM SEARCH BOX */}
        <div className="search-container">
          <div className="trip-type-tabs">
            <button 
              className={`trip-tab ${activeTripType === 'one-way' ? 'active' : ''}`}
              onClick={() => setActiveTripType('one-way')}
            >
              One Way
            </button>
            <button 
              className={`trip-tab ${activeTripType === 'round-trip' ? 'active' : ''}`}
              onClick={() => setActiveTripType('round-trip')}
            >
              Round Trip
            </button>
            <button 
              className={`trip-tab ${activeTripType === 'multi-city' ? 'active' : ''}`}
              onClick={() => setActiveTripType('multi-city')}
            >
              Multi City
            </button>
          </div>

          <form onSubmit={onSearchSubmit} className="search-form-premium">
            <div className="search-fields">
              <div className="search-field-premium">
                <label className="field-label">From</label>
                <input
                  type="text"
                  name="from"
                  value={searchForm.from}
                  onChange={onSearchChange}
                  placeholder="Departure city"
                  className="field-input"
                  required
                />
                <span className="field-hint">Origin</span>
              </div>

              <div className="search-swap">
                <button type="button" className="swap-btn" title="Swap cities">
                  ⇄
                </button>
              </div>

              <div className="search-field-premium">
                <label className="field-label">To</label>
                <input
                  type="text"
                  name="to"
                  value={searchForm.to}
                  onChange={onSearchChange}
                  placeholder="Destination city"
                  className="field-input"
                  required
                />
                <span className="field-hint">Destination</span>
              </div>

              <div className="search-field-premium">
                <label className="field-label">Date</label>
                <input
                  type="date"
                  name="date"
                  value={searchForm.date}
                  onChange={onSearchChange}
                  className="field-input"
                  required
                />
                <span className="field-hint">Travel Date</span>
              </div>

              <div className="search-field-premium">
                <label className="field-label">Travellers</label>
                <input
                  type="number"
                  name="travellers"
                  value={searchForm.travellers}
                  onChange={onSearchChange}
                  placeholder="1"
                  min="1"
                  max="9"
                  className="field-input"
                />
                <span className="field-hint">Passengers</span>
              </div>
            </div>

            <button type="submit" className="search-btn-premium">
              <span className="btn-icon">🔍</span>
              Search Flights
            </button>
          </form>

          {/* SMART LOCATION DETECTOR */}
          <LocationDetector 
            onSelectAirport={onSelectNearbyAirport} 
            compact={true} 
          />
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="quick-actions-section">
        <div className="section-title">
          <h2>Quick Actions</h2>
          <p>Everything you need for your journey</p>
        </div>
        <div className="quick-actions-grid">
          <div className="quick-action-card" onClick={() => document.querySelector('.search-btn-premium')?.scrollIntoView({ behavior: 'smooth' })}>
            <div className="quick-action-icon blue">🔍</div>
            <h3>Book a Flight</h3>
            <p>Search and book your next trip</p>
          </div>
          <div className="quick-action-card" onClick={() => window.location.hash = 'mytrips'}>
            <div className="quick-action-icon orange">🎫</div>
            <h3>My Bookings</h3>
            <p>View and manage your trips</p>
          </div>
          <div className="quick-action-card" onClick={() => window.location.hash = 'checkin'}>
            <div className="quick-action-icon green">🛂</div>
            <h3>Web Check-in</h3>
            <p>Check-in online 48h before</p>
          </div>
          <div className="quick-action-card" onClick={() => window.location.hash = 'dashboard'}>
            <div className="quick-action-icon purple">📡</div>
            <h3>Flight Status</h3>
            <p>Track flights in real-time</p>
          </div>
        </div>
      </section>

      {/* PREMIUM FEATURES */}
      <section className="features-section">
        <div className="section-title">
          <h2>Why Fly Indigo?</h2>
          <p>India's most loved airline experience</p>
        </div>
        <div className="features-grid">
          <div className="feature-card-premium">
            <div className="feature-image blue">✈️</div>
            <h3>300+ Daily Flights</h3>
            <p>Connect to 80+ destinations across India and abroad with our extensive network</p>
          </div>
          <div className="feature-card-premium">
            <div className="feature-image orange">⏱</div>
            <h3>99% On-Time</h3>
            <p>India's most punctual airline. We value your time as much as you do</p>
          </div>
          <div className="feature-card-premium">
            <div className="feature-image green">💰</div>
            <h3>Lowest Fares</h3>
            <p>Guaranteed best prices with no hidden charges. Pay only for what you need</p>
          </div>
          <div className="feature-card-premium">
            <div className="feature-image purple">🛡️</div>
            <h3>Safe Travel</h3>
            <p>Enhanced safety protocols and contactless travel for your peace of mind</p>
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="trust-section">
        <div className="trust-badges">
          <div className="trust-item">
            <span className="trust-number">100M+</span>
            <span className="trust-label">Passengers</span>
          </div>
          <div className="trust-divider"></div>
          <div className="trust-item">
            <span className="trust-number">4.5★</span>
            <span className="trust-label">App Rating</span>
          </div>
          <div className="trust-divider"></div>
          <div className="trust-item">
            <span className="trust-number">#1</span>
            <span className="trust-label">in India</span>
          </div>
          <div className="trust-divider"></div>
          <div className="trust-item">
            <span className="trust-number">24/7</span>
            <span className="trust-label">Support</span>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================
// CHECK-IN PAGE COMPONENT
// ============================================
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
      const response = await axios.get('http://localhost:8080/bookings');
      const found = response.data.find(b => 
        b.id.toString() === pnr || 
        `IND${b.id.toString().padStart(8, '0')}` === pnr.toUpperCase() ||
        b.passengerEmail === email
      );

      if (found) {
        setBooking(found);
        if (window.showIndigoToast) {
          window.showIndigoToast('Booking Found', `PNR: IND${found.id.toString().padStart(8, '0')}`, 'success', '✅');
        }
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
    if (window.showIndigoToast) {
      window.showIndigoToast('Boarding Pass', 'Downloading your boarding pass...', 'info', '📥');
    }
  };

  return (
    <div className="checkin-page">
      <div className="checkin-header">
        <div className="checkin-badge">🛂</div>
        <h1>Online Check-in</h1>
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
          <button type="submit" className="btn-checkin-submit" disabled={isLoading}>
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
            <div className="booking-found-header">
              <span className="success-check">✅</span>
              <h3>Booking Found!</h3>
            </div>
            <div className="booking-summary-card">
              <div className="summary-row">
                <span className="label">PNR:</span>
                <span className="value booking-id">IND{booking.id.toString().padStart(8, '0')}</span>
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
            <button className="btn-download-boarding" onClick={downloadBoardingPass}>
              📥 Download Boarding Pass
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
