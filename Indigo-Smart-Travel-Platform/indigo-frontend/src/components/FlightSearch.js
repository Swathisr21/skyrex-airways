import React, { useState } from "react";

function FlightSearch({ onSearch, isLoading }) {
  const [searchData, setSearchData] = useState({
    source: '',
    destination: '',
    date: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!searchData.source || !searchData.destination || !searchData.date) {
      alert('Please fill in all fields');
      return;
    }

    if (searchData.source === searchData.destination) {
      alert('Source and destination cannot be the same');
      return;
    }

    onSearch(searchData);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="flight-search-panel">
      <div className="search-header">
        <h2>Find Your Flight</h2>
        <p>Search for available flights and book your journey</p>
      </div>
      
      <form onSubmit={handleSubmit} className="search-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="source">From</label>
            <input
              type="text"
              id="source"
              name="source"
              value={searchData.source}
              onChange={handleInputChange}
              placeholder="Enter source city"
              className="search-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="destination">To</label>
            <input
              type="text"
              id="destination"
              name="destination"
              value={searchData.destination}
              onChange={handleInputChange}
              placeholder="Enter destination city"
              className="search-input"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={searchData.date}
              onChange={handleInputChange}
              min={today}
              className="search-input date-input"
            />
          </div>
          
          <div className="form-group actions">
            <button 
              type="submit" 
              className="search-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner small"></span>
                  Searching...
                </>
              ) : (
                <>
                  🔍 Search Flights
                </>
              )}
            </button>
          </div>
        </div>
      </form>
      
      <div className="search-tips">
        <h3>Search Tips:</h3>
        <ul>
          <li>Enter city names or airport codes</li>
          <li>Select your preferred travel date</li>
          <li>Flexible with dates? Try nearby dates for better prices</li>
        </ul>
      </div>
    </div>
  );
}

export default FlightSearch;