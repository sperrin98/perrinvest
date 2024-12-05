import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Securities.css';

function Securities() {
  const [securities, setSecurities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSecurities, setFilteredSecurities] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch securities on component mount
  useEffect(() => {
    async function fetchSecurities() {
      try {
        // Fetch data from backend
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/securities`);
        
        // Log the fetched data to verify that it contains latest_price and percent_change
        console.log("Securities Data from API:", response.data);
        
        // Update the state with fetched data
        setSecurities(response.data);
      } catch (err) {
        console.error('Error fetching securities:', err);
        setError('Failed to load securities.');
      }
    }

    fetchSecurities();
  }, []);

  // Filter securities based on the search term
  useEffect(() => {
    setFilteredSecurities(
      securities.filter(security =>
        security.security_long_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        security.security_short_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, securities]);

  const handleRowClick = (id) => {
    navigate(`/securities/${id}`);
  };

  return (
    <div className="securities-container">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search securities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <table className="securities-table">
        <thead>
          <tr>
            <th className="first-header">Security Long Name</th>
            <th>Security Short Name</th>
            <th>Latest Price</th>
            <th>% Change</th>
            <th>Day Chart</th>
          </tr>
        </thead>
        <tbody>
          {error && <tr><td colSpan="5">{error}</td></tr>}
          {filteredSecurities.length > 0 ? (
            filteredSecurities.map(security => (
              <tr
                key={security.security_id}
                onClick={() => handleRowClick(security.security_id)}
                className="clickable-row"
              >
                <td className="first-column">{security.security_long_name}</td>
                <td>{security.security_short_name}</td>
                <td>{security.latest_price ? `$${security.latest_price.toFixed(2)}` : 'No Price Available'}</td>
                <td
                  className={security.percent_change >= 0 ? 'positive-change' : 'negative-change'}
                >
                  {security.percent_change !== null && security.percent_change !== undefined
                    ? `${security.percent_change.toFixed(2)}%`
                    : 'No Change Available'}
                </td>
                <td>
                  <img 
                    src={security.day_chart_url || '/placeholder-chart.png'} 
                    alt={`Day chart for ${security.security_short_name}`} 
                    className="day-chart" 
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No securities found</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="back-button-container">
        <Link to="/" className="back-button">Go Back to Homepage</Link>
      </div>
    </div>
  );
}

export default Securities;
