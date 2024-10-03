import React, { useEffect, useState } from 'react';
import './Correlations.css';

const Correlations = () => {
  // Correct order of state variables
  const [secId1, setSecId1] = useState(1);  // Security 1
  const [secId2, setSecId2] = useState(2);  // Security 2
  const [period, setPeriod] = useState(90);  // Number of Periods
  const [timeframeType, setTimeframeType] = useState('yearly');  // Timeframe Type
  const [endDate, setEndDate] = useState('2023-01-01');  // End Date
  const [correlations, setCorrelations] = useState([]);  
  const [loading, setLoading] = useState(false);  
  const [error, setError] = useState(null);  
  const [securities, setSecurities] = useState([]);  

  // Fetch securities when the component mounts
  useEffect(() => {
    const fetchSecurities = async () => {
      try {
        const response = await fetch('http://localhost:5000/securities'); 
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
    setLoading(true);
    setError(null);
    try {
        const response = await fetch(
            `http://localhost:5000/correlations?sec_id=${secId1}&sec_id2=${secId2}&period=${period}&timeframe_type=${timeframeType}&end_date=${endDate}`
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response Error:', errorText);
            throw new Error(`Failed to fetch data: ${errorText}`);
        }

        const data = await response.json();
        setCorrelations(data);
    } catch (error) {
        console.error('Error fetching correlations:', error);
        setError(error.message);
    } finally {
        setLoading(false);
    }
};


  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();  
    fetchCorrelations();  
  };

  return (
    <div className="correlation-container" style={{ marginTop: '200px' }}>
      <h2>Calculate Correlation</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="end-date">End Date:</label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="period">Period (Number of Periods):</label>
          <input
            type="number"
            id="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="timeframe-type">Timeframe Type:</label>
          <select
            id="timeframe-type"
            value={timeframeType}
            onChange={(e) => setTimeframeType(e.target.value)}
            required
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
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
