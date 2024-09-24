import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Securities.css'; // Import the CSS file

function Securities() {
  const [securities, setSecurities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSecurities, setFilteredSecurities] = useState([]);
  const navigate = useNavigate();
  const [error, setError] = useState(null);  // Define the error state

  useEffect(() => {
    async function fetchSecurities() {
      try {
        const response = await axios.get('http://localhost:5000/securities');
        console.log(response.data);  // Log the data to inspect its structure
        setSecurities(response.data);
      } catch (err) {
        console.error('Error fetching securities:', err);
        setError('Failed to load securities.');
      }
    }
    fetchSecurities();
  }, []);

  // Update filtered securities whenever searchTerm changes
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
      
      <table className='securities-table'>
        <thead>
          <tr>
            <th className='id-header'></th>
            <th className="first-header">Security Long Name</th>
            <th>Security Short Name</th>
          </tr>
        </thead>
        <tbody>
          {error && <tr><td colSpan="3">{error}</td></tr>}
          {filteredSecurities.length > 0 ? (
            filteredSecurities.map(security => (
              <tr key={security.security_id} onClick={() => handleRowClick(security.security_id)} className="clickable-row">
                <td>{security.security_id}</td>
                <td className="first-column">{security.security_long_name}</td>
                <td>{security.security_short_name}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No securities found</td>
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