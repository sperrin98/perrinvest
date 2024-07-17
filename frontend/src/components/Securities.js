import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './Securities.css'; // Import the CSS file

function Securities() {
  const [securities, setSecurities] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/securities')
      .then(response => {
        setSecurities(response.data);
      })
      .catch(error => {
        console.error('Error fetching securities:', error);
      });
  }, []);

  const handleRowClick = (id) => {
    navigate(`/securities/${id}`);
  };

  return (
    <div className="securities-container">
      <h1 className="security-header">Securities Data</h1>
      <table>
        <thead>
          <tr>
            <th className='id-header'></th>
            <th className="first-header">Security Long Name</th>
            <th>Security Short Name</th>
          </tr>
        </thead>
        <tbody>
          {securities.map(security => (
            <tr key={security.security_id} onClick={() => handleRowClick(security[0])} className="clickable-row">
              <td>{security[0]}</td>
              <td className="first-column">{security[1]}</td>
              <td>{security[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="back-button">
        <Link to="/">Go Back to Homepage</Link>
      </div>
    </div>
  );
}

export default Securities;
