import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NewMarketRatio.css'; // CSS file for styling

const NewMarketRatio = () => {
  const [securities, setSecurities] = useState([]);
  const [security1, setSecurity1] = useState('');
  const [security2, setSecurity2] = useState('');
  const [ratioData, setRatioData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/securities')
      .then(response => {
        setSecurities(response.data);
      })
      .catch(error => {
        console.error('Error fetching securities:', error);
        setError('Error fetching securities.');
      });
  }, []);

  const handleCalculateRatio = () => {
    if (!security1 || !security2) {
      setError('Please select both securities.');
      return;
    }

    axios.post('http://localhost:5000/api/market-ratio', { security_id1: security1, security_id2: security2 })
      .then(response => {
        setRatioData(response.data.market_ratio);
        setError(null);
      })
      .catch(error => {
        console.error('Error calculating market ratio:', error);
        setError('Error calculating market ratio.');
      });
  };

  return (
    <div className="new-market-ratio-container">
      <h1 className="header">Create New Market Ratio</h1>
      <div className="form-container">
        <div className="form-group">
          <label htmlFor="security1">Select Security 1:</label>
          <select
            id="security1"
            value={security1}
            onChange={(e) => setSecurity1(e.target.value)}
          >
            <option value="">-- Select Security --</option>
            {securities.map(sec => (
              <option key={sec[0]} value={sec[0]}>{sec[1]}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="security2">Select Security 2:</label>
          <select
            id="security2"
            value={security2}
            onChange={(e) => setSecurity2(e.target.value)}
          >
            <option value="">-- Select Security --</option>
            {securities.map(sec => (
              <option key={sec[0]} value={sec[0]}>{sec[1]}</option>
            ))}
          </select>
        </div>
        <button onClick={handleCalculateRatio} className="calculate-button">Calculate Ratio</button>
        {error && <div className="error-message">{error}</div>}
      </div>
      {ratioData.length > 0 && (
        <div className="result">
          <h2>New Market Ratio</h2>
          <ul>
            {ratioData.map((entry, index) => (
              <li key={index}>
                Date: {entry.date}, Ratio: {entry.ratio}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NewMarketRatio;
