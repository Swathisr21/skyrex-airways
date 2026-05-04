import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const INDIAN_AIRPORTS = [
  { code: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', lat: 28.5562, lng: 77.1000 },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', lat: 19.0896, lng: 72.8656 },
  { code: 'BLR', name: 'Kempegowda International', city: 'Bangalore', lat: 13.1986, lng: 77.7066 },
  { code: 'MAA', name: 'Chennai International', city: 'Chennai', lat: 12.9941, lng: 80.1709 },
  { code: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad', lat: 17.2403, lng: 78.4294 },
  { code: 'CCU', name: 'Netaji Subhas Chandra Bose International', city: 'Kolkata', lat: 22.6547, lng: 88.4467 },
  { code: 'AMD', name: 'Sardar Vallabhbhai Patel International', city: 'Ahmedabad', lat: 23.0722, lng: 72.6256 },
  { code: 'COK', name: 'Cochin International', city: 'Kochi', lat: 10.1518, lng: 76.3930 },
  { code: 'PNQ', name: 'Pune Airport', city: 'Pune', lat: 18.5793, lng: 73.9089 },
  { code: 'GOI', name: 'Dabolim Airport', city: 'Goa', lat: 15.3808, lng: 73.8314 },
  { code: 'JAI', name: 'Jaipur International', city: 'Jaipur', lat: 26.8242, lng: 75.8122 },
  { code: 'LKO', name: 'Chaudhary Charan Singh International', city: 'Lucknow', lat: 26.7606, lng: 80.8893 },
  { code: 'IXC', name: 'Chandigarh International', city: 'Chandigarh', lat: 30.6735, lng: 76.7885 },
  { code: 'TRV', name: 'Trivandrum International', city: 'Thiruvananthapuram', lat: 8.4821, lng: 76.9201 },
  { code: 'IXB', name: 'Bagdogra Airport', city: 'Siliguri', lat: 26.6812, lng: 88.3286 },
  { code: 'BBI', name: 'Biju Patnaik International', city: 'Bhubaneswar', lat: 20.2444, lng: 85.8178 },
  { code: 'IXM', name: 'Madurai Airport', city: 'Madurai', lat: 9.8345, lng: 78.0934 },
  { code: 'VNS', name: 'Lal Bahadur Shastri Airport', city: 'Varanasi', lat: 25.4524, lng: 82.8733 },
  { code: 'PAT', name: 'Jay Prakash Narayan Airport', city: 'Patna', lat: 25.5913, lng: 85.0880 },
  { code: 'IXR', name: 'Birsa Munda Airport', city: 'Ranchi', lat: 23.3144, lng: 85.3217 }
];

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function LocationDetector({ onSelectAirport, compact = false }) {
  const [location, setLocation] = useState(null);
  const [nearbyAirports, setNearbyAirports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detected, setDetected] = useState(false);

  const detectLocation = useCallback(() => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setLocation({ lat: userLat, lng: userLng });

        // Find nearby airports
        const airportsWithDistance = INDIAN_AIRPORTS.map(airport => ({
          ...airport,
          distance: getDistanceFromLatLonInKm(userLat, userLng, airport.lat, airport.lng)
        }));

        const sorted = airportsWithDistance.sort((a, b) => a.distance - b.distance);
        setNearbyAirports(sorted.slice(0, 3));
        setDetected(true);
        setLoading(false);

        // Show browser notification for nearby airports
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('📍 Location Detected', {
            body: `Nearest airport: ${sorted[0].name} (${sorted[0].code}) - ${Math.round(sorted[0].distance)}km away`,
            icon: '/logo.png'
          });
        }
      },
      (err) => {
        let errorMsg = 'Unable to retrieve your location';
        if (err.code === 1) errorMsg = 'Location access denied. Please enable location permissions.';
        if (err.code === 2) errorMsg = 'Location unavailable. Please try again.';
        if (err.code === 3) errorMsg = 'Location request timed out.';
        setError(errorMsg);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
    );
  }, []);

  // Auto-detect on mount with a slight delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!detected && !loading) {
        detectLocation();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [detectLocation, detected, loading]);

  const handleSelectAirport = (airport) => {
    if (onSelectAirport) {
      onSelectAirport(airport);
    }
  };

  if (compact) {
    return (
      <div className="location-detector-compact">
        {loading && (
          <div className="location-loading">
            <span className="location-pulse"></span>
            <span>Detecting location...</span>
          </div>
        )}
        {!loading && nearbyAirports.length > 0 && (
          <div className="nearby-airports-compact">
            <div className="nearby-header">
              <span className="location-icon">📍</span>
              <span>Nearby Airports</span>
            </div>
            <div className="airport-chips">
              {nearbyAirports.map(airport => (
                <button
                  key={airport.code}
                  className="airport-chip"
                  onClick={() => handleSelectAirport(airport)}
                  title={`${airport.name} - ${Math.round(airport.distance)}km away`}
                >
                  <span className="chip-code">{airport.code}</span>
                  <span className="chip-city">{airport.city}</span>
                  <span className="chip-dist">{Math.round(airport.distance)}km</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {error && (
          <div className="location-error-compact">
            <span>⚠️ {error}</span>
            <button onClick={detectLocation} className="retry-location-btn">Retry</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="location-detector">
      <div className="location-header">
        <div className="location-icon-wrapper">
          <span className="location-icon">📍</span>
        </div>
        <div className="location-title">
          <h3>Smart Location</h3>
          <p>Find airports near you</p>
        </div>
      </div>

      {!detected && !loading && (
        <button onClick={detectLocation} className="detect-location-btn">
          <span className="detect-icon">🎯</span>
          Detect My Location
        </button>
      )}

      {loading && (
        <div className="location-loading-state">
          <div className="location-spinner"></div>
          <p>Finding your location...</p>
        </div>
      )}

      {nearbyAirports.length > 0 && (
        <div className="nearby-airports-list">
          <h4>Nearest Airports</h4>
          {nearbyAirports.map((airport, index) => (
            <div
              key={airport.code}
              className={`nearby-airport-card ${index === 0 ? 'nearest' : ''}`}
              onClick={() => handleSelectAirport(airport)}
            >
              <div className="airport-rank">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>
              <div className="airport-info">
                <div className="airport-name">{airport.name}</div>
                <div className="airport-meta">
                  <span className="airport-code">{airport.code}</span>
                  <span className="airport-city">{airport.city}</span>
                </div>
              </div>
              <div className="airport-distance">
                <span className="distance-value">{Math.round(airport.distance)}</span>
                <span className="distance-unit">km</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="location-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={detectLocation} className="retry-btn">Try Again</button>
        </div>
      )}
    </div>
  );
}

export default LocationDetector;
export { INDIAN_AIRPORTS };
