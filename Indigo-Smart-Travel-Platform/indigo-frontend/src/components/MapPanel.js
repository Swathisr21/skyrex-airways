import React, { useEffect, useRef, useState } from "react";
import "./MapPanel.css";

// Indian city coordinates for Google Maps
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

// Load Google Maps Script dynamically
const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', resolve);
      return;
    }
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=geometry,marker`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

function MapPanel({ selectedFlight, liveTracking = false }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const planeMarkerRef = useRef(null);
  const flightPathRef = useRef(null);
  const sourceMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const [trackingProgress, setTrackingProgress] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const animationFrameRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Google Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    loadGoogleMapsScript()
      .then(() => {
        if (!mapRef.current) {
          mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
            center: { lat: 20.5937, lng: 78.9629 }, // Center of India
            zoom: 5,
            mapTypeId: 'roadmap',
            styles: [
              { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
              {
                featureType: 'administrative.locality',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d59563' }]
              },
              {
                featureType: 'poi',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d59563' }]
              },
              {
                featureType: 'poi.park',
                elementType: 'geometry',
                stylers: [{ color: '#263c3f' }]
              },
              {
                featureType: 'poi.park',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#6b9a76' }]
              },
              {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{ color: '#38414e' }]
              },
              {
                featureType: 'road',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#212a37' }]
              },
              {
                featureType: 'road',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#9ca5b3' }]
              },
              {
                featureType: 'road.highway',
                elementType: 'geometry',
                stylers: [{ color: '#746855' }]
              },
              {
                featureType: 'road.highway',
                elementType: 'geometry.stroke',
                stylers: [{ color: '#1f2835' }]
              },
              {
                featureType: 'road.highway',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#f3d19c' }]
              },
              {
                featureType: 'transit',
                elementType: 'geometry',
                stylers: [{ color: '#2f3948' }]
              },
              {
                featureType: 'transit.station',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#d59563' }]
              },
              {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#17263c' }]
              },
              {
                featureType: 'water',
                elementType: 'labels.text.fill',
                stylers: [{ color: '#515c6d' }]
              },
              {
                featureType: 'water',
                elementType: 'labels.text.stroke',
                stylers: [{ color: '#17263c' }]
              }
            ]
          });
        }
        setMapLoaded(true);
      })
      .catch(err => {
        console.error("Failed to load Google Maps:", err);
      });

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update map when flight is selected
  useEffect(() => {
    if (!mapRef.current || !selectedFlight || !mapLoaded) return;

    const sourceCoords = CITY_COORDINATES[selectedFlight.source];
    const destCoords = CITY_COORDINATES[selectedFlight.destination];

    if (!sourceCoords || !destCoords) {
      console.warn("Coordinates not found for route");
      return;
    }

    const map = mapRef.current;
    const google = window.google;

    // Clear existing markers and routes
    if (planeMarkerRef.current) {
      planeMarkerRef.current.setMap(null);
      planeMarkerRef.current = null;
    }
    if (flightPathRef.current) {
      flightPathRef.current.setMap(null);
      flightPathRef.current = null;
    }
    if (sourceMarkerRef.current) {
      sourceMarkerRef.current.setMap(null);
      sourceMarkerRef.current = null;
    }
    if (destMarkerRef.current) {
      destMarkerRef.current.setMap(null);
      destMarkerRef.current = null;
    }

    // Fit map to show both cities
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(new google.maps.LatLng(sourceCoords.lat, sourceCoords.lng));
    bounds.extend(new google.maps.LatLng(destCoords.lat, destCoords.lng));
    map.fitBounds(bounds, 50);

    // Create custom SVG icons
    const airportSvg = {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#2196F3',
      fillOpacity: 1,
      strokeColor: '#fff',
      strokeWeight: 2,
      scale: 12
    };

    const planeSvg = {
      path: 'M21 16V14L15 10.5V4.5C15 3.67 14.33 3 13.5 3C13.22 3 12.95 3.08 12.74 3.22L9.74 6.22C9.53 6.08 9.26 6 8.98 6C8.15 6 7.5 6.67 7.5 7.5V9.5L2 13V15H7.5V18.5C7.5 19.33 8.17 20 9 20C9.28 20 9.55 19.92 9.76 19.78L13.5 16.5L19 20V22L21 23V16Z',
      fillColor: '#4CAF50',
      fillOpacity: 1,
      strokeColor: '#2E7D32',
      strokeWeight: 0.5,
      scale: 1.5,
      anchor: new google.maps.Point(12, 12)
    };

    // Add airport markers
    sourceMarkerRef.current = new google.maps.Marker({
      position: { lat: sourceCoords.lat, lng: sourceCoords.lng },
      map: map,
      icon: airportSvg,
      title: `${selectedFlight.source} - Departure: ${selectedFlight.departureTime}`,
      label: {
        text: '✈',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold'
      }
    });

    destMarkerRef.current = new google.maps.Marker({
      position: { lat: destCoords.lat, lng: destCoords.lng },
      map: map,
      icon: airportSvg,
      title: `${selectedFlight.destination} - Arrival: ${selectedFlight.arrivalTime}`,
      label: {
        text: '✈',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold'
      }
    });

    // Draw curved flight path
    const drawCurvedPath = () => {
      const midLat = (sourceCoords.lat + destCoords.lat) / 2 + 2;
      const pathPoints = [];
      const segments = 50;

      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const lat = (1 - t) * (1 - t) * sourceCoords.lat +
                    2 * (1 - t) * t * midLat +
                    t * t * destCoords.lat;
        const lng = (1 - t) * (1 - t) * sourceCoords.lng +
                    2 * (1 - t) * t * ((sourceCoords.lng + destCoords.lng) / 2) +
                    t * t * destCoords.lng;
        pathPoints.push({ lat, lng });
      }

      flightPathRef.current = new google.maps.Polyline({
        path: pathPoints,
        geodesic: true,
        strokeColor: '#4CAF50',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        icons: [{
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            scale: 4
          },
          offset: '0',
          repeat: '20px'
        }]
      });
      flightPathRef.current.setMap(map);

      return pathPoints;
    };

    const flightPathPoints = drawCurvedPath();

    // Add info window at midpoint
    const statusColor = selectedFlight.status === 'ON_TIME' ? '#4CAF50' :
                        selectedFlight.status === 'DELAYED' ? '#FF9800' : '#F44336';

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 8px; font-family: Arial, sans-serif;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${selectedFlight.flightNumber}</div>
          <div style="color: ${statusColor}; font-size: 12px;">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; margin-right: 4px;"></span>
            ${selectedFlight.status}
          </div>
          <div style="font-size: 11px; color: #666; margin-top: 4px;">${selectedFlight.airline}</div>
        </div>
      `
    });

    const midPoint = flightPathPoints[Math.floor(flightPathPoints.length / 2)];
    infoWindow.setPosition(midPoint);
    infoWindow.open(map);

    // Start live tracking animation if enabled
    if (liveTracking) {
      startLiveTracking(flightPathPoints, map, planeSvg);
    } else {
      // Place plane at midpoint for static view
      const midIndex = Math.floor(flightPathPoints.length / 2);
      planeMarkerRef.current = new google.maps.Marker({
        position: flightPathPoints[midIndex],
        map: map,
        icon: planeSvg,
        title: `${selectedFlight.flightNumber}`,
        optimized: false
      });
    }

    return () => {
      if (sourceMarkerRef.current) sourceMarkerRef.current.setMap(null);
      if (destMarkerRef.current) destMarkerRef.current.setMap(null);
      if (flightPathRef.current) flightPathRef.current.setMap(null);
      if (planeMarkerRef.current) planeMarkerRef.current.setMap(null);
      infoWindow.close();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [selectedFlight, liveTracking, mapLoaded]);

  // Live tracking animation
  const startLiveTracking = (pathPoints, map, planeSvg) => {
    setIsTracking(true);
    let currentIndex = 0;
    const totalPoints = pathPoints.length;
    const speed = 100; // milliseconds per segment
    const google = window.google;

    const animate = () => {
      if (currentIndex < totalPoints) {
        const progress = (currentIndex / totalPoints) * 100;
        setTrackingProgress(progress);

        if (planeMarkerRef.current) {
          planeMarkerRef.current.setPosition(pathPoints[currentIndex]);
        } else {
          planeMarkerRef.current = new google.maps.Marker({
            position: pathPoints[currentIndex],
            map: map,
            icon: planeSvg,
            title: `${selectedFlight.flightNumber}`,
            optimized: false
          });
        }

        // Update popup with current position
        const sourceCoords = CITY_COORDINATES[selectedFlight.source];
        const destCoords = CITY_COORDINATES[selectedFlight.destination];

        if (sourceCoords && destCoords) {
          const distance = calculateDistance(sourceCoords, destCoords);
          const remaining = distance * (1 - currentIndex / totalPoints);
          const covered = distance * (currentIndex / totalPoints);

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; font-family: Arial, sans-serif; min-width: 200px;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 6px;">${selectedFlight.flightNumber}</div>
                <div style="margin-bottom: 8px;">
                  <div style="background: #e0e0e0; border-radius: 4px; height: 8px; overflow: hidden;">
                    <div style="background: #4CAF50; height: 100%; width: ${progress}%; transition: width 0.1s;"></div>
                  </div>
                  <div style="font-size: 11px; color: #666; margin-top: 4px;">${progress.toFixed(1)}% Complete</div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                  <span>Covered: ${covered.toFixed(0)} km</span>
                  <span>Remaining: ${remaining.toFixed(0)} km</span>
                </div>
                <div style="font-size: 12px; color: #2196F3;">
                  ETA: ${calculateETA(selectedFlight.arrivalTime, progress)}
                </div>
              </div>
            `
          });
          infoWindow.open(map, planeMarkerRef.current);
        }

        currentIndex++;
        animationFrameRef.current = setTimeout(() => {
          requestAnimationFrame(animate);
        }, speed);
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
    if (progress >= 100) return 'Arrived';
    const arrival = new Date();
    const [hours, minutes] = arrivalTime.split(':').map(Number);
    arrival.setHours(hours, minutes || 0);
    return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper function to calculate flight duration
  const calculateDuration = (departure, arrival) => {
    return '2h 30m';
  };

  // Helper function to calculate approximate distance
  const calculateDistanceDisplay = (source, destination) => {
    const distances = {
      'Delhi-Mumbai': 1150,
      'Delhi-Bangalore': 1740,
      'Delhi-Chennai': 1760,
      'Mumbai-Bangalore': 840,
      'Mumbai-Chennai': 1030,
      'Bangalore-Chennai': 290,
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
                <span className={`status-badge ${selectedFlight.status === 'ON_TIME' ? 'on-time' : selectedFlight.status === 'DELAYED' ? 'delayed' : 'cancelled'}`}>
                  {selectedFlight.status.replace('_', ' ')}
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
              style={{ height: '400px', width: '100%', borderRadius: '8px' }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default MapPanel;
