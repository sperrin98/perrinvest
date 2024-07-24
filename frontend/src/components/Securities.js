import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Securities.css'; // Import the CSS file

function Securities() {
  const [securities, setSecurities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSecurities, setFilteredSecurities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/securities')
      .then(response => {
        setSecurities(response.data);
        setFilteredSecurities(response.data); // Initialize filtered securities
      })
      .catch(error => {
        console.error('Error fetching securities:', error);
      });
  }, []);

  // Update filtered securities whenever searchTerm changes
  useEffect(() => {
    setFilteredSecurities(
      securities.filter(security =>
        security[1].toLowerCase().includes(searchTerm.toLowerCase()) ||
        security[2].toLowerCase().includes(searchTerm.toLowerCase())
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
          {filteredSecurities.length > 0 ? (
            filteredSecurities.map(security => (
              <tr key={security[0]} onClick={() => handleRowClick(security[0])} className="clickable-row">
                <td>{security[0]}</td>
                <td className="first-column">{security[1]}</td>
                <td>{security[2]}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2">No securities found</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="back-button">
        <Link to="/">Go Back to Homepage</Link>
      </div>
    </div>
  );
}

export default Securities;
