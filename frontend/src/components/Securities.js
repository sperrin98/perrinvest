import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Securities.css';

function Securities() {
  const [securities, setSecurities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSecurities, setFilteredSecurities] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSecurities() {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/securities`);
        console.log("Fetched securities:", response.data);

        if (response.data.error) {
          setError(response.data.error);
        } else {
          setSecurities(response.data);
        }
      } catch (err) {
        console.error('Error fetching securities:', err);
        setError('Failed to load securities.');
      }
    }

    fetchSecurities();
  }, []);

  useEffect(() => {
    setFilteredSecurities(
      securities.filter(security =>
        security.security_long_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        security.security_short_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, securities]);

  const handleRowClick = (security_id) => {
    console.log("Clicked row with security_id:", security_id);  // Debugging line
    if (security_id) {
      navigate(`/securities/${security_id}`);  // This will navigate to the correct security page
    } else {
      console.error("Security ID is missing!");
    }
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
            <th className="long-name-header">Security Long Name</th>
            <th>Security Short Name</th>
            <th>Latest Price</th>
            <th>% Change</th>
          </tr>
        </thead>
        <tbody>
          {error && <tr><td colSpan="4">{error}</td></tr>}
          {filteredSecurities.length > 0 ? (
            filteredSecurities.map(security => (
              <tr
                key={security.security_id}
                onClick={() => handleRowClick(security.security_id)}  // Clicking a row navigates to /securities/{security_id}
                className="clickable-row"
              >
                <td className="security-long-name">{security.security_long_name}</td>
                <td className='security-short-name'>{security.security_short_name}</td>
                <td className='latest-price'>{security.latest_price ? `$${security.latest_price.toFixed(2)}` : 'No Price Available'}</td>
                <td className={security.percent_change >= 0 ? 'positive-change' : 'negative-change'}>
                  {security.percent_change !== null && security.percent_change !== undefined
                    ? `${security.percent_change.toFixed(2)}%`
                    : 'No Change Available'}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No securities found</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="back-button-container">
        <button onClick={() => navigate('/')} className="back-button">Go Back to Homepage</button>
      </div>
    </div>
  );
}

export default Securities;
