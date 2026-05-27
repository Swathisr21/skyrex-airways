import React, { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet icons in React
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Airport coordinates database
const AIRPORTS = {
  Delhi: { lat: 28.5562, lng: 77.1, code: "DEL", name: "Indira Gandhi International" },
  Mumbai: { lat: 19.0896, lng: 72.8656, code: "BOM", name: "Chhatrapati Shivaji Maharaj International" },
  Bangalore: { lat: 13.1986, lng: 77.7066, code: "BLR", name: "Kempegowda International" },
  Chennai: { lat: 12.9941, lng: 80.1709, code: "MAA", name: "Chennai International" },
  Kolkata: { lat: 22.6547, lng: 88.4467, code: "CCU", name: "Netaji Subhas Chandra Bose International" },
  Hyderabad: { lat: 17.2314, lng: 78.4294, code: "HYD", name: "Rajiv Gandhi International" },
  Pune: { lat: 18.5822, lng: 73.9197, code: "PNQ", name: "Pune International" },
  Ahmedabad: { lat: 23.0738, lng: 72.6267, code: "AMD", name: "Sardar Vallabhbhai Patel International" },
  Jaipur: { lat: 26.8242, lng: 75.8122, code: "JAI", name: "Jaipur International" },
  Goa: { lat: 15.3808, lng: 73.8314, code: "GOI", name: "Dabolim International" },
  Kochi: { lat: 10.152, lng: 76.4019, code: "COK", name: "Cochin International" },
  Lucknow: { lat: 26.7606, lng: 80.8893, code: "LKO", name: "Chaudhary Charan Singh International" },
};

// Custom airport marker icon
const airportIcon = L.divIcon({
  className: "custom-airport-marker",
  html: `<div class="airport-marker-icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="#0057b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Animated plane icon for route
const animatedPlaneIcon = L.divIcon({
  className: "animated-plane-marker",
  html: `<div class="plane-marker-animated">
    <svg viewBox="0 0 24 24" fill="#0057b8" stroke="#fff" stroke-width="1.5">
      <path d="M21 16v-2l-6-3.5V5c0-1.1-.9-2-2-2s-2 .9-2 2v5.5L5 14v2l6-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L15 19v-5.5l6 2.5z"/>
    </svg>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Map bounds fitter component
function MapBoundsFitter({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
    }
  }, [bounds, map]);
  return null;
}

// Generate a curved route between two points
function generateCurvedRoute(start, end, segments = 50) {
  const points = [];
  const midLat = (start.lat + end.lat) / 2 + (Math.abs(end.lng - start.lng) > 10 ? 3 : 1.5);
  const midLng = (start.lng + end.lng) / 2;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const lat =
      (1 - t) * (1 - t) * start.lat +
      2 * (1 - t) * t * midLat +
      t * t * end.lat;
    const lng =
      (1 - t) * (1 - t) * start.lng +
      2 * (1 - t) * t * midLng +
      t * t * end.lng;
    points.push([lat, lng]);
  }
  return points;
}

// Calculate distance in km between two coordinates
function calculateDistance(coord1, coord2) {
  const R = 6371;
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function FlightMap({ selectedFlight, showAllAirports = true, height = "500px" }) {
  const [planePosition, setPlanePosition] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 5;

  const sourceAirport = selectedFlight ? AIRPORTS[selectedFlight.source] : null;
  const destAirport = selectedFlight ? AIRPORTS[selectedFlight.destination] : null;

  const routePoints = useMemo(() => {
    if (sourceAirport && destAirport) {
      return generateCurvedRoute(sourceAirport, destAirport);
    }
    return [];
  }, [sourceAirport, destAirport]);

  const planeRoutePosition = useMemo(() => {
    if (routePoints.length > 0 && planePosition < routePoints.length) {
      return routePoints[planePosition];
    }
    return null;
  }, [routePoints, planePosition]);

  // Animate plane along route
  useEffect(() => {
    if (!selectedFlight || routePoints.length === 0) {
      setPlanePosition(0);
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    setPlanePosition(0);
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex++;
      if (currentIndex >= routePoints.length) {
        clearInterval(interval);
        setIsAnimating(false);
        setPlanePosition(routePoints.length - 1);
      } else {
        setPlanePosition(currentIndex);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [selectedFlight, routePoints]);

  // Build bounds
  const bounds = useMemo(() => {
    if (sourceAirport && destAirport) {
      return [
        [sourceAirport.lat, sourceAirport.lng],
        [destAirport.lat, destAirport.lng],
      ];
    }
    return null;
  }, [sourceAirport, destAirport]);

  const allAirports = useMemo(() => Object.entries(AIRPORTS), []);

  return (
    <div className="flight-map-wrapper">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height, width: "100%", borderRadius: "12px" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {bounds && <MapBoundsFitter bounds={bounds} />}

        {/* Show all airports when no flight selected */}
        {showAllAirports && !selectedFlight &&
          allAirports.map(([city, data]) => (
            <Marker
              key={city}
              position={[data.lat, data.lng]}
              icon={airportIcon}
            >
              <Popup>
                <div className="airport-popup">
                  <strong>{data.name}</strong>
                  <span className="airport-code">{data.code}</span>
                  <span className="airport-city">{city}</span>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Route display when flight selected */}
        {selectedFlight && sourceAirport && destAirport && (
          <>
            {/* Source airport */}
            <Marker
              position={[sourceAirport.lat, sourceAirport.lng]}
              icon={airportIcon}
            >
              <Popup>
                <div className="airport-popup">
                  <strong>{sourceAirport.name}</strong>
                  <span className="airport-code">{sourceAirport.code}</span>
                  <span className="airport-city">{selectedFlight.source}</span>
                  <span className="flight-time">
                    Departure: {selectedFlight.departureTime}
                  </span>
                </div>
              </Popup>
            </Marker>

            {/* Destination airport */}
            <Marker
              position={[destAirport.lat, destAirport.lng]}
              icon={airportIcon}
            >
              <Popup>
                <div className="airport-popup">
                  <strong>{destAirport.name}</strong>
                  <span className="airport-code">{destAirport.code}</span>
                  <span className="airport-city">{selectedFlight.destination}</span>
                  <span className="flight-time">
                    Arrival: {selectedFlight.arrivalTime}
                  </span>
                </div>
              </Popup>
            </Marker>

            {/* Route polyline with dashed pattern */}
            <Polyline
              positions={routePoints}
              pathOptions={{
                color: "#0057b8",
                weight: 3,
                opacity: 0.8,
                dashArray: "10, 10",
                lineCap: "round",
              }}
            />

            {/* Animated plane on route */}
            {planeRoutePosition && (
              <Marker
                position={planeRoutePosition}
                icon={animatedPlaneIcon}
                zIndexOffset={1000}
              >
                <Popup>
                  <div className="plane-popup">
                    <strong>{selectedFlight.flightNumber}</strong>
                    <span>{selectedFlight.airline}</span>
                    <span className="route-info-popup">
                      {selectedFlight.source} → {selectedFlight.destination}
                    </span>
                    <span className="distance-info">
                      ~{calculateDistance(sourceAirport, destAirport)} km
                    </span>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Route glow effect */}
            <Polyline
              positions={routePoints}
              pathOptions={{
                color: "#0057b8",
                weight: 8,
                opacity: 0.15,
                lineCap: "round",
              }}
            />
          </>
        )}
      </MapContainer>

      {/* Flight route info overlay */}
      {selectedFlight && sourceAirport && destAirport && (
        <div className="route-info-overlay">
          <div className="route-info-card">
            <div className="route-header">
              <span className="route-flight-number">
                {selectedFlight.flightNumber}
              </span>
              <span
                className={`route-status ${
                  selectedFlight.status === "ON_TIME"
                    ? "on-time"
                    : selectedFlight.status === "DELAYED"
                    ? "delayed"
                    : "cancelled"
                }`}
              >
                {selectedFlight.status.replace("_", " ")}
              </span>
            </div>
            <div className="route-cities">
              <div className="route-city">
                <span className="city-code">{sourceAirport.code}</span>
                <span className="city-name">{selectedFlight.source}</span>
              </div>
              <div className="route-arrow">
                <span>✈</span>
                <small>~{calculateDistance(sourceAirport, destAirport)} km</small>
              </div>
              <div className="route-city">
                <span className="city-code">{destAirport.code}</span>
                <span className="city-name">{selectedFlight.destination}</span>
              </div>
            </div>
            {isAnimating && (
              <div className="route-progress-bar">
                <div
                  className="route-progress-fill"
                  style={{
                    width: `${(planePosition / (routePoints.length - 1)) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FlightMap;
