import React, { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Airport database with coordinates
const AIRPORTS_DB = [
  { city: "Delhi", lat: 28.5562, lng: 77.1, code: "DEL", name: "Indira Gandhi International", type: "International" },
  { city: "Mumbai", lat: 19.0896, lng: 72.8656, code: "BOM", name: "Chhatrapati Shivaji Maharaj International", type: "International" },
  { city: "Bangalore", lat: 13.1986, lng: 77.7066, code: "BLR", name: "Kempegowda International", type: "International" },
  { city: "Chennai", lat: 12.9941, lng: 80.1709, code: "MAA", name: "Chennai International", type: "International" },
  { city: "Kolkata", lat: 22.6547, lng: 88.4467, code: "CCU", name: "Netaji Subhas Chandra Bose International", type: "International" },
  { city: "Hyderabad", lat: 17.2314, lng: 78.4294, code: "HYD", name: "Rajiv Gandhi International", type: "International" },
  { city: "Pune", lat: 18.5822, lng: 73.9197, code: "PNQ", name: "Pune International", type: "Domestic" },
  { city: "Ahmedabad", lat: 23.0738, lng: 72.6267, code: "AMD", name: "Sardar Vallabhbhai Patel International", type: "International" },
  { city: "Jaipur", lat: 26.8242, lng: 75.8122, code: "JAI", name: "Jaipur International", type: "Domestic" },
  { city: "Goa", lat: 15.3808, lng: 73.8314, code: "GOI", name: "Dabolim International", type: "International" },
  { city: "Kochi", lat: 10.152, lng: 76.4019, code: "COK", name: "Cochin International", type: "International" },
  { city: "Lucknow", lat: 26.7606, lng: 80.8893, code: "LKO", name: "Chaudhary Charan Singh International", type: "Domestic" },
  { city: "Thiruvananthapuram", lat: 8.4821, lng: 76.9205, code: "TRV", name: "Trivandrum International", type: "International" },
  { city: "Bhubaneswar", lat: 20.2444, lng: 85.8178, code: "BBI", name: "Biju Patnaik International", type: "Domestic" },
  { city: "Indore", lat: 22.7213, lng: 75.8008, code: "IDR", name: "Devi Ahilya Bai Holkar Airport", type: "Domestic" },
];

// Custom marker icons
const nearbyAirportIcon = L.divIcon({
  className: "nearby-airport-marker",
  html: `<div class="nearby-airport-icon">
    <svg viewBox="0 0 24 24" fill="#0057b8" stroke="white" stroke-width="1">
      <path d="M21 16v-2l-6-3.5V5c0-1.1-.9-2-2-2s-2 .9-2 2v5.5L5 14v2l6-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L15 19v-5.5l6 2.5z"/>
    </svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const userLocationIcon = L.divIcon({
  className: "user-location-marker",
  html: `<div class="user-location-icon">
    <div class="user-location-pulse"></div>
    <div class="user-location-dot"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Map recenter component
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 8, { animate: true, duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
}

// Calculate distance between two coordinates in km
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

function NearbyAirports() {
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [nearbyAirports, setNearbyAirports] = useState([]);
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [radiusKm, setRadiusKm] = useState(500);

  const detectLocation = useCallback(() => {
    setIsLocating(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      setIsLocating(false);
      // Fallback to Delhi
      const fallback = { lat: 28.5562, lng: 77.1, city: "Delhi" };
      setUserLocation(fallback);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setUserLocation(loc);
        setIsLocating(false);
      },
      (error) => {
        let message = "Unable to retrieve your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied. Using default location.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
          default:
            break;
        }
        setLocationError(message);
        setIsLocating(false);
        // Fallback to Delhi
        const fallback = { lat: 28.5562, lng: 77.1, city: "Delhi" };
        setUserLocation(fallback);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Auto-detect location on mount
  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // Calculate nearby airports when location changes
  useEffect(() => {
    if (!userLocation) return;

    const airportsWithDistance = AIRPORTS_DB.map((airport) => ({
      ...airport,
      distance: getDistanceFromLatLonInKm(
        userLocation.lat,
        userLocation.lng,
        airport.lat,
        airport.lng
      ),
    }));

    const sorted = airportsWithDistance
      .filter((a) => a.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    setNearbyAirports(sorted);
    if (sorted.length > 0 && !selectedAirport) {
      setSelectedAirport(sorted[0]);
    }
  }, [userLocation, radiusKm, selectedAirport]);

  const formatDistance = (km) => {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    if (km < 100) return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
  };

  const mapCenter = selectedAirport
    ? [selectedAirport.lat, selectedAirport.lng]
    : userLocation
    ? [userLocation.lat, userLocation.lng]
    : [20.5937, 78.9629];

  return (
    <div className="nearby-airports-wrapper">
      {/* Header */}
      <div className="nearby-header">
        <div className="nearby-title">
          <span className="nearby-icon">📍</span>
          <h3>Nearby Airports</h3>
        </div>
        <button
          className={`detect-location-btn ${isLocating ? "locating" : ""}`}
          onClick={detectLocation}
          disabled={isLocating}
        >
          {isLocating ? (
            <>
              <span className="spin-icon">🔄</span> Detecting...
            </>
          ) : (
            <>
              <span>📡</span> Detect Location
            </>
          )}
        </button>
      </div>

      {/* Location status */}
      {locationError && (
        <div className="location-error">⚠️ {locationError}</div>
      )}
      {userLocation && !locationError && (
        <div className="location-status">
          <span className="status-dot"></span>
          Location detected: {userLocation.lat.toFixed(2)}, {userLocation.lng.toFixed(2)}
        </div>
      )}

      {/* Radius selector */}
      <div className="radius-selector">
        <label>Search radius:</label>
        <div className="radius-options">
          {[100, 300, 500, 1000].map((r) => (
            <button
              key={r}
              className={`radius-btn ${radiusKm === r ? "active" : ""}`}
              onClick={() => setRadiusKm(r)}
            >
              {r < 1000 ? `${r} km` : `${r / 1000}k km`}
            </button>
          ))}
        </div>
      </div>

      <div className="nearby-content">
        {/* Airport list */}
        <div className="airport-list-panel">
          {nearbyAirports.length === 0 ? (
            <div className="no-airports">
              <span className="no-airports-icon">✈️</span>
              <p>No airports found within {radiusKm} km.</p>
              <p>Try increasing the search radius.</p>
            </div>
          ) : (
            <div className="airport-list">
              {nearbyAirports.map((airport, index) => (
                <div
                  key={airport.code}
                  className={`airport-list-item ${
                    selectedAirport?.code === airport.code ? "selected" : ""
                  }`}
                  onClick={() => setSelectedAirport(airport)}
                >
                  <div className="airport-rank">{index + 1}</div>
                  <div className="airport-info">
                    <div className="airport-name-row">
                      <strong>{airport.city}</strong>
                      <span className="airport-code-badge">{airport.code}</span>
                    </div>
                    <div className="airport-meta">
                      <span className="airport-distance">
                        📍 {formatDistance(airport.distance)}
                      </span>
                      <span className={`airport-type ${airport.type.toLowerCase()}`}>
                        {airport.type}
                      </span>
                    </div>
                  </div>
                  <div className="airport-arrow">›</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="airport-map-panel">
          <MapContainer
            center={mapCenter}
            zoom={selectedAirport ? 8 : 5}
            style={{ height: "100%", width: "100%", borderRadius: "12px" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <MapRecenter center={mapCenter} zoom={selectedAirport ? 8 : 5} />

            {/* User location */}
            {userLocation && (
              <>
                <Marker
                  position={[userLocation.lat, userLocation.lng]}
                  icon={userLocationIcon}
                >
                  <Popup>
                    <div className="user-popup">
                      <strong>Your Location</strong>
                      <span>
                        {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                      </span>
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={[userLocation.lat, userLocation.lng]}
                  radius={radiusKm * 1000}
                  pathOptions={{
                    color: "#0057b8",
                    fillColor: "#0057b8",
                    fillOpacity: 0.05,
                    weight: 1,
                    dashArray: "5, 10",
                  }}
                />
              </>
            )}

            {/* Nearby airport markers */}
            {nearbyAirports.map((airport) => (
              <Marker
                key={airport.code}
                position={[airport.lat, airport.lng]}
                icon={nearbyAirportIcon}
                eventHandlers={{
                  click: () => setSelectedAirport(airport),
                }}
              >
                <Popup>
                  <div className="airport-popup">
                    <strong>{airport.name}</strong>
                    <span className="airport-code">{airport.code}</span>
                    <span className="airport-city">{airport.city}</span>
                    <span className="airport-distance-popup">
                      📍 {formatDistance(airport.distance)} away
                    </span>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default NearbyAirports;
