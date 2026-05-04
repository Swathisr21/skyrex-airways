import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "./MapPanel.css";

// Fix for Leaflet default marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Indian city coordinates
const CITY_COORDINATES = {
  "Delhi": { lat: 28.6139, lng: 77.2090 },
  "Mumbai": { lat: 19.0760, lng: 72.8777 },
  "Bangalore": { lat: 12.9716, lng: 77.5946 },
  "Chennai": { lat: 13.0827, lng: 80.2707 },
  "Kolkata": { lat: 22.5726, lng: 88.3639 },
  "Hyderabad": { lat: 17.3850, lng: 78.4867 },
  "Pune": { lat: 18.5204, lng: 73.8567 },
  "Ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "Jaipur": { lat: 26.9124, lng: 75.7873 },
  "Goa": { lat: 15.2993, lng: 74.1240 },
};

// Custom plane icon
const planeIcon = L.divIcon({
  html: `<div class="plane-marker">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 16V14L15 10.5V4.5C15 3.67 14.33 3 13.5 3C13.22 3 12.95 3.08 12.74 3.22L9.74 6.22C9.53 6.08 9.26 6 8.98 6C8.15 6 7.5 6.67 7.5 7.5V9.5L2 13V15H7.5V18.5C7.5 19.33 8.17 20 9 20C9.28 20 9.55 19.92 9.76 19.78L13.5 16.5L19 20V22L21 23V16Z" fill="#4CAF50" stroke="#2E7D32" stroke-width="0.5"/>
    </svg>
  </div>`,
  className: "custom-plane-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Airport icon
const airportIcon = L.divIcon({
  html: `<div class="airport-marker">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#2196F3">
      <circle cx="12" cy="12" r="10"/>
      <text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">✈</text>
    </svg>
  </div>`,
  className: "custom-airport-marker",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

function MapPanel({ selectedFlight, liveTracking = false }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const planeMarkerRef = useRef(null);
  const routingControlRef = useRef(null);
  const [trackingProgress, setTrackingProgress] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const animationFrameRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629], // Center of India
        zoom: 5,
        zoomControl: true,
      });

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(mapRef.current);

      // Add dark mode map tiles as alternative
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update map when flight is selected
  useEffect(() => {
    if (!mapRef.current || !selectedFlight) return;

    const sourceCoords = CITY_COORDINATES[selectedFlight.source];
    const destCoords = CITY_COORDINATES[selectedFlight.destination];

    if (!sourceCoords || !destCoords) {
      console.warn("Coordinates not found for route");
      return;
    }

    const map = mapRef.current;

    // Clear existing markers and routes
    if (planeMarkerRef.current) {
      map.removeLayer(planeMarkerRef.current);
      planeMarkerRef.current = null;
    }
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    // Fit map to show both cities
    const bounds = L.latLngBounds(
      L.latLng(sourceCoords.lat, sourceCoords.lng),
      L.latLng(destCoords.lat, destCoords.lng)
    );
    map.fitBounds(bounds, { padding: [50, 50] });

    // Add airport markers
    const sourceMarker = L.marker([sourceCoords.lat, sourceCoords.lng], {
      icon: airportIcon,
    }).addTo(map).bindPopup(`
      <div class="popup-content">
        <strong>${selectedFlight.source}</strong><br/>
        Departure: ${selectedFlight.departureTime}<br/>
        <span class="popup-label">Origin</span>
      </div>
    `);

    const destMarker = L.marker([destCoords.lat, destCoords.lng], {
      icon: airportIcon,
    }).addTo(map).bindPopup(`
      <div class="popup-content">
        <strong>${selectedFlight.destination}</strong><br/>
        Arrival: ${selectedFlight.arrivalTime}<br/>
        <span class="popup-label">Destination</span>
      </div>
    `);

    // Draw curved flight path
    const drawCurvedPath = () => {
      const midLat = (sourceCoords.lat + destCoords.lat) / 2 + 2;
      const points = [];
      const segments = 50;
      
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const lat = (1 - t) * (1 - t) * sourceCoords.lat + 
                    2 * (1 - t) * t * midLat + 
                    t * t * destCoords.lat;
        const lng = (1 - t) * (1 - t) * sourceCoords.lng + 
                    2 * (1 - t) * t * ((sourceCoords.lng + destCoords.lng) / 2) + 
                    t * t * destCoords.lng;
        points.push([lat, lng]);
      }
      
      L.polyline(points, {
        color: "#4CAF50",
        weight: 3,
        opacity: 0.8,
        dashArray: "10, 10",
      }).addTo(map);

      return points;
    };

    const flightPathPoints = drawCurvedPath();

    // Add flight status indicator
    const statusColor = selectedFlight.status === "ON_TIME" ? "#4CAF50" : 
                        selectedFlight.status === "DELAYED" ? "#FF9800" : "#F44336";
    
    const statusPopup = L.popup()
      .setLatLng([(sourceCoords.lat + destCoords.lat) / 2, (sourceCoords.lng + destCoords.lng) / 2])
      .setContent(`
        <div class="flight-status-popup">
          <div class="flight-number">${selectedFlight.flightNumber}</div>
          <div class="flight-status" style="color: ${statusColor}">
            <span class="status-dot" style="background: ${statusColor}"></span>
            ${selectedFlight.status}
          </div>
          <div class="flight-airline">${selectedFlight.airline}</div>
        </div>
      `);
    map.openPopup(statusPopup);

    // Start live tracking animation if enabled
    if (liveTracking) {
      startLiveTracking(flightPathPoints, map);
    } else {
      // Place plane at midpoint for static view
      const midIndex = Math.floor(flightPathPoints.length / 2);
      planeMarkerRef.current = L.marker(flightPathPoints[midIndex], {
        icon: planeIcon,
      }).addTo(map);
    }

    return () => {
      map.removeLayer(sourceMarker);
      map.removeLayer(destMarker);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [selectedFlight, liveTracking]);

  // Live tracking animation
  const startLiveTracking = (pathPoints, map) => {
    setIsTracking(true);
    let currentIndex = 0;
    const totalPoints = pathPoints.length;
    const speed = 50; // milliseconds per segment

    const animate = () => {
      if (currentIndex < totalPoints) {
        const progress = (currentIndex / totalPoints) * 100;
        setTrackingProgress(progress);

        if (planeMarkerRef.current) {
          map.removeLayer(planeMarkerRef.current);
        }

        planeMarkerRef.current = L.marker(pathPoints[currentIndex], {
          icon: planeIcon,
        }).addTo(map);

        // Update popup with current position
        const sourceCoords = CITY_COORDINATES[selectedFlight.source];
        const destCoords = CITY_COORDINATES[selectedFlight.destination];
        
        if (sourceCoords && destCoords) {
          const distance = calculateDistance(sourceCoords, destCoords);
          const remaining = distance * (1 - currentIndex / totalPoints);
          const covered = distance * (currentIndex / totalPoints);

          planeMarkerRef.current.bindPopup(`
            <div class="plane-popup">
              <div class="flight-number">${selectedFlight.flightNumber}</div>
              <div class="tracking-info">
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">${progress.toFixed(1)}% Complete</div>
              </div>
              <div class="distance-info">
                <span>Covered: ${covered.toFixed(0)} km</span>
                <span>Remaining: ${remaining.toFixed(0)} km</span>
              </div>
              <div class="eta-info">
                <span>ETA: ${calculateETA(selectedFlight.arrivalTime, progress)}</span>
              </div>
            </div>
          `).openPopup();
        }

        currentIndex++;
        animationFrameRef.current = setTimeout(animate, speed);
      } else {
        setIsTracking(false);
      }
    };

    animate();
  };

  // Calculate distance between two points
  const calculateDistance = (source, dest) => {
    const R = 6371; // Earth's radius in km
    const dLat = (dest.lat - source.lat) * Math.PI / 180;
    const dLng = (dest.lng - source.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(source.lat * Math.PI / 180) * Math.cos(dest.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate ETA based on progress
  const calculateETA = (arrivalTime, progress) => {
    if (progress >= 100) return "Arrived";
    const arrival = new Date();
    const [hours, minutes] = arrivalTime.split(":").map(Number);
    arrival.setHours(hours, minutes || 0);
    return arrival.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Helper function to calculate flight duration
  const calculateDuration = (departure, arrival) => {
    return "2h 30m";
  };

  // Helper function to calculate approximate distance
  const calculateDistanceDisplay = (source, destination) => {
    const distances = {
      "Delhi-Mumbai": 1150,
      "Delhi-Bangalore": 1740,
      "Delhi-Chennai": 1760,
      "Mumbai-Bangalore": 840,
      "Mumbai-Chennai": 1030,
      "Bangalore-Chennai": 290,
    };
    const route = `${source}-${destination}`;
    const reverseRoute = `${destination}-${source}`;
    return distances[route] || distances[reverseRoute] || 1000;
  };

  return (
    <section className="panel map-panel">
      <div className="panel-header">
        <h2>
          <span className="map-icon-header">🗺️</span>
          Live Flight Tracking
        </h2>
        {isTracking && (
          <div className="live-indicator active">
            <span className="live-dot pulse"></span>
            LIVE TRACKING
          </div>
        )}
      </div>

      <div className="map-container">
        {!selectedFlight ? (
          <div className="map-placeholder">
            <div className="placeholder-content">
              <div className="map-icon-large">🗺️</div>
              <h3>Flight Route Map</h3>
              <p>Select a flight to view its route on the interactive map</p>
              <p className="hint">
                <span className="highlight">Click "Track Route"</span> on any flight card to see live tracking
              </p>
              <div className="placeholder-features">
                <div className="feature-item">
                  <span className="feature-icon">📍</span>
                  <span>Real-time position tracking</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">📊</span>
                  <span>Distance & progress monitoring</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">⏱️</span>
                  <span>Live ETA updates</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="map-content">
            <div className="flight-tracking-card">
              <div className="tracking-header">
                <div className="flight-identity">
                  <h3>{selectedFlight.flightNumber}</h3>
                  <span className="airline-name">{selectedFlight.airline}</span>
                </div>
                <span className={`status-badge ${selectedFlight.status === "ON_TIME" ? "on-time" : selectedFlight.status === "DELAYED" ? "delayed" : "cancelled"}`}>
                  {selectedFlight.status.replace("_", " ")}
                </span>
              </div>

              <div className="route-info">
                <div className="route-city departure">
                  <div className="city-code">{selectedFlight.source.substring(0, 3).toUpperCase()}</div>
                  <div className="city-name">{selectedFlight.source}</div>
                  <div className="flight-time">{selectedFlight.departureTime}</div>
                </div>

                <div className="route-progress">
                  {isTracking && (
                    <div className="progress-container">
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${trackingProgress}%` }}></div>
                      </div>
                      <div className="progress-stats">
                        <span>{trackingProgress.toFixed(1)}% Complete</span>
                        <span className="live-badge">LIVE</span>
                      </div>
                    </div>
                  )}
                  <div className="flight-duration">
                    <span className="duration-line"></span>
                    <span className="duration-text">{calculateDuration(selectedFlight.departureTime, selectedFlight.arrivalTime)}</span>
                  </div>
                </div>

                <div className="route-city arrival">
                  <div className="city-code">{selectedFlight.destination.substring(0, 3).toUpperCase()}</div>
                  <div className="city-name">{selectedFlight.destination}</div>
                  <div className="flight-time">{selectedFlight.arrivalTime}</div>
                </div>
              </div>

              <div className="flight-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Distance</span>
                  <span className="detail-value">~{calculateDistanceDisplay(selectedFlight.source, selectedFlight.destination)} km</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Aircraft</span>
                  <span className="detail-value">Airbus A320</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Altitude</span>
                  <span className="detail-value">32,000 ft</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Speed</span>
                  <span className="detail-value">850 km/h</span>
                </div>
              </div>

              {isTracking && (
                <div className="tracking-controls">
                  <button 
                    className="btn-stop-tracking"
                    onClick={() => {
                      if (animationFrameRef.current) {
                        clearTimeout(animationFrameRef.current);
                        setIsTracking(false);
                      }
                    }}
                  >
                    ⏸️ Stop Tracking
                  </button>
                </div>
              )}
            </div>

            <div 
              ref={mapContainerRef} 
              className="interactive-map"
              style={{ height: "400px", width: "100%", borderRadius: "8px" }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default MapPanel;