import React, { useState } from "react";

function PassengerForm({ onSubmit, onCancel }) {
  const [passengers, setPassengers] = useState([
    {
      name: '',
      age: '',
      gender: 'Male',
      seatCount: 1
    }
  ]);

  const [errors, setErrors] = useState({});

  const handlePassengerChange = (index, field, value) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index][field] = value;
    setPassengers(updatedPassengers);
    
    // Clear error for this field
    if (errors[`${index}-${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${index}-${field}`];
        return newErrors;
      });
    }
  };

  const addPassenger = () => {
    setPassengers([
      ...passengers,
      {
        name: '',
        age: '',
        gender: 'Male',
        seatCount: 1
      }
    ]);
  };

  const removePassenger = (index) => {
    if (passengers.length > 1) {
      const updatedPassengers = passengers.filter((_, i) => i !== index);
      setPassengers(updatedPassengers);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    passengers.forEach((passenger, index) => {
      if (!passenger.name.trim()) {
        newErrors[`${index}-name`] = 'Name is required';
        isValid = false;
      }

      if (!passenger.age || passenger.age < 1 || passenger.age > 120) {
        newErrors[`${index}-age`] = 'Valid age is required (1-120)';
        isValid = false;
      }

      if (!passenger.seatCount || passenger.seatCount < 1) {
        newErrors[`${index}-seatCount`] = 'At least 1 seat required';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(passengers);
    }
  };

  const totalSeats = passengers.reduce((sum, p) => sum + (parseInt(p.seatCount) || 0), 0);

  return (
    <div className="passenger-form-panel">
      <div className="form-header">
        <h2>Passenger Details</h2>
        <p>Please provide details for all passengers</p>
      </div>

      <form onSubmit={handleSubmit} className="passenger-form">
        {passengers.map((passenger, index) => (
          <div key={index} className="passenger-card">
            <div className="passenger-card-header">
              <h3>Passenger {index + 1}</h3>
              {passengers.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removePassenger(index)}
                  title="Remove passenger"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label htmlFor={`name-${index}`}>Full Name</label>
                <input
                  type="text"
                  id={`name-${index}`}
                  value={passenger.name}
                  onChange={(e) => handlePassengerChange(index, 'name', e.target.value)}
                  placeholder="Enter passenger name"
                  className="form-input"
                />
                {errors[`${index}-name`] && (
                  <span className="error-text">{errors[`${index}-name`]}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor={`age-${index}`}>Age</label>
                <input
                  type="number"
                  id={`age-${index}`}
                  value={passenger.age}
                  onChange={(e) => handlePassengerChange(index, 'age', e.target.value)}
                  placeholder="Age"
                  min="1"
                  max="120"
                  className="form-input"
                />
                {errors[`${index}-age`] && (
                  <span className="error-text">{errors[`${index}-age`]}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor={`gender-${index}`}>Gender</label>
                <select
                  id={`gender-${index}`}
                  value={passenger.gender}
                  onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                  className="form-input"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor={`seatCount-${index}`}>Seats</label>
                <input
                  type="number"
                  id={`seatCount-${index}`}
                  value={passenger.seatCount}
                  onChange={(e) => handlePassengerChange(index, 'seatCount', e.target.value)}
                  min="1"
                  max="9"
                  className="form-input"
                />
                {errors[`${index}-seatCount`] && (
                  <span className="error-text">{errors[`${index}-seatCount`]}</span>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="form-actions">
          <button
            type="button"
            className="add-passenger-btn"
            onClick={addPassenger}
            disabled={passengers.length >= 5}
          >
            + Add Another Passenger
          </button>
        </div>

        <div className="form-summary">
          <div className="summary-info">
            <span>Total Passengers: {passengers.length}</span>
            <span>Total Seats: {totalSeats}</span>
          </div>
        </div>

        <div className="form-buttons">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="submit-btn">
            Continue to Seat Selection
          </button>
        </div>
      </form>
    </div>
  );
}

export default PassengerForm;