import React, { useState, useEffect } from 'react';
import axios from 'axios';

function MarketRatioSelection() {
  const [securities, setSecurities] = useState([]);
  const [selectedSecurity1, setSelectedSecurity1] = useState('');
  const [selectedSecurity2, setSelectedSecurity2] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSecurities() {
      try {
        const response = await axios.get('http://localhost:5000/securities');
        setSecurities(response.data);
      } catch (err) {
        console.error('Error fetching securities:', err);
        setError('Failed to load securities.');
      }
    }
    fetchSecurities();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (selectedSecurity1 === selectedSecurity2) {
      setError('Please select two different securities.');
      return;
    }
    try {
      const response = await axios.get('http://localhost:5000/market-ratios/divide', {
        params: {
          security_long_name1: selectedSecurity1,
          security_long_name2: selectedSecurity2
        }
      });
      setResult(response.data.divided_prices);
      setError(null);
    } catch (err) {
      console.error('Error dividing market ratios:', err);
      setError('An error occurred while dividing market ratios.');
      setResult(null);
    }
  };

  return (
    <div>
      <h2>Divide Market Ratios</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Security 1:
            <select
              value={selectedSecurity1}
              onChange={(e) => setSelectedSecurity1(e.target.value)}
              required
            >
              <option value="">Select a security</option>
              {securities.map((security) => (
                <option key={security.security_id} value={security.security_long_name}>
                  {security.security_long_name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div>
          <label>
            Security 2:
            <select
              value={selectedSecurity2}
              onChange={(e) => setSelectedSecurity2(e.target.value)}
              required
            >
              <option value="">Select a security</option>
              {securities.map((security) => (
                <option key={security.security_id} value={security.security_long_name}>
                  {security.security_long_name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit">Divide</button>
      </form>
      {error && <div className="error">{error}</div>}
      {result && (
        <div>
          <h3>Results</h3>
          <ul>
            {result.map((item, index) => (
              <li key={index}>
                Price Date: {item.price_date} - Divided Price: {item.divided_price}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default MarketRatioSelection;
