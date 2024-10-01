// src/components/Correlations.js
import React, { useEffect, useState } from 'react';
import './Correlations.css';

const Correlations = () => {
  const [correlations, setCorrelations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState('2023-01-01'); // Default start date
  const [periodDays, setPeriodDays] = useState(90); // Default period of days
  const [secId1, setSecId1] = useState(1); // Default first security ID
  const [secId2, setSecId2] = useState(2); // Default second security ID

  const [securities, setSecurities] = useState([]); // To hold the list of securities

  // Fetch securities on component mount
  useEffect(() => {
    const fetchSecurities = async () => {
      try {
        const response = await fetch('http://localhost:5000/securities'); // Adjust endpoint as necessary
        if (!response.ok) {
          throw new Error('Failed to fetch securities');
        }
        const data = await response.json();
        setSecurities(data);
      } catch (error) {
        console.error('Error fetching securities:', error);
        setError(error.message);
      }
    };

    fetchSecurities();
  }, []);

  // Function to fetch correlations based on input parameters
  const fetchCorrelations = async () => {
    setLoading(true); // Start loading
    setError(null); // Clear previous errors
    try {
      const response = await fetch(
        `http://localhost:5000/correlations?sec_id=${secId1}&sec_id2=${secId2}&period_days=${periodDays}&start_date=${startDate}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch data: ${errorText}`);
      }

      const data = await response.json();
      setCorrelations(data);
    } catch (error) {
      console.error('Error fetching correlations:', error);
      setError(error.message);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Handle form submission to fetch correlations
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission
    fetchCorrelations(); // Fetch correlations
  };

  return (
    <div className="correlation-container" style={{ marginTop: '200px' }}>
      <h2>Calculate Correlation</h2>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="start-date">Start Date:</label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label htmlFor="period-days">Period of Days:</label>
          <input
            type="number"
            id="period-days"
            value={periodDays}
            onChange={(e) => setPeriodDays(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="sec-id-1">Select Security 1:</label>
          <select id="sec-id-1" value={secId1} onChange={(e) => setSecId1(e.target.value)} required>
            {securities.length > 0 ? (
              securities.map((security) => (
                <option key={security.security_id} value={security.security_id}>
                  {security.security_long_name} ({security.ticker_symbol})
                </option>
              ))
            ) : (
              <option value="">Loading securities...</option>
            )}
          </select>
        </div>

        <div>
          <label htmlFor="sec-id-2">Select Security 2:</label>
          <select id="sec-id-2" value={secId2} onChange={(e) => setSecId2(e.target.value)} required>
            {securities.length > 0 ? (
              securities.map((security) => (
                <option key={security.security_id} value={security.security_id}>
                  {security.security_long_name} ({security.ticker_symbol})
                </option>
              ))
            ) : (
              <option value="">Loading securities...</option>
            )}
          </select>
        </div>

        <button type="submit">Calculate Correlation</button>
      </form>

      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}

      {correlations.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Window Start Date</th>
              <th>Window End Date</th>
              <th>Correlation Value</th>
            </tr>
          </thead>
          <tbody>
            {correlations.map((correlation, index) => (
              <tr key={index}>
                <td>{correlation.window_start_date}</td>
                <td>{correlation.window_end_date}</td>
                <td>{correlation.correlation_value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Correlations;
