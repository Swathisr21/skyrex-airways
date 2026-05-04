import React, { useEffect, useState } from "react";

function WeatherPanel({ selectedFlight }) {
  const [weatherData, setWeatherData] = useState({
    source: null,
    destination: null
  });

  useEffect(() => {
    if (selectedFlight) {
      // Simulate weather data fetch - in production, use real weather API
      const mockWeatherData = {
        source: getMockWeather(selectedFlight.source),
        destination: getMockWeather(selectedFlight.destination)
      };
      setWeatherData(mockWeatherData);
    } else {
      setWeatherData({ source: null, destination: null });
    }
  }, [selectedFlight]);

  const getMockWeather = (city) => {
    // Mock weather data for major Indian cities
    const weatherConditions = [
      { condition: "Sunny", icon: "☀️", temp: 32, humidity: 45 },
      { condition: "Partly Cloudy", icon: "⛅", temp: 28, humidity: 60 },
      { condition: "Clear", icon: "🌤️", temp: 25, humidity: 55 },
      { condition: "Light Rain", icon: "🌦️", temp: 22, humidity: 75 },
      { condition: "Cloudy", icon: "☁️", temp: 24, humidity: 65 }
    ];

    // Use city name to generate consistent mock data
    const seed = city.length;
    const weather = weatherConditions[seed % weatherConditions.length];
    
    return {
      city,
      ...weather,
      windSpeed: 10 + (seed % 15),
      visibility: 8 + (seed % 5)
    };
  };

  const getWeatherAlert = (weather) => {
    if (!weather) return null;
    
    if (weather.condition === "Light Rain" || weather.condition === "Heavy Rain") {
      return { type: "warning", message: "Possible delays due to weather" };
    }
    if (weather.temp > 35) {
      return { type: "info", message: "High temperature - runway conditions monitored" };
    }
    return { type: "success", message: "Favorable weather conditions" };
  };

  const WeatherCard = ({ weather, type }) => {
    if (!weather) {
      return (
        <div className="weather-card empty">
          <p>Select a flight to see weather</p>
        </div>
      );
    }

    const alert = getWeatherAlert(weather);

    return (
      <div className={`weather-card ${type}`}>
        <div className="weather-header">
          <h4>{weather.city}</h4>
          <span className="weather-icon">{weather.icon}</span>
        </div>
        
        <div className="weather-main">
          <span className="temperature">{weather.temp}°C</span>
          <span className="condition">{weather.condition}</span>
        </div>
        
        <div className="weather-details">
          <div className="detail">
            <span className="detail-icon">💧</span>
            <span>{weather.humidity}% Humidity</span>
          </div>
          <div className="detail">
            <span className="detail-icon">💨</span>
            <span>{weather.windSpeed} km/h Wind</span>
          </div>
          <div className="detail">
            <span className="detail-icon">👁️</span>
            <span>{weather.visibility} km Visibility</span>
          </div>
        </div>
        
        {alert && (
          <div className={`weather-alert ${alert.type}`}>
            <span className="alert-icon">
              {alert.type === "warning" ? "⚠️" : alert.type === "success" ? "✅" : "ℹ️"}
            </span>
            <span>{alert.message}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="panel weather-panel">
      <div className="panel-header">
        <h2>Weather Forecast</h2>
        <span className="update-time">Updated: {new Date().toLocaleTimeString()}</span>
      </div>
      
      <div className="weather-container">
        <div className="weather-section">
          <h3>Departure</h3>
          <WeatherCard weather={weatherData.source} type="departure" />
        </div>
        
        <div className="weather-section">
          <h3>Arrival</h3>
          <WeatherCard weather={weatherData.destination} type="arrival" />
        </div>
      </div>
      
      {!selectedFlight && (
        <div className="weather-hint">
          <p>🌤️ Weather information will be displayed when you select a flight</p>
        </div>
      )}
    </aside>
  );
}

export default WeatherPanel;