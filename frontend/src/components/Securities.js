import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom

function Securities() {
  const [securities, setSecurities] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/securities')
      .then(response => {
        setSecurities(response.data);
      })
      .catch(error => {
        console.error('Error fetching securities:', error);
      });
  }, []);

  return (
    <div>
      <h1>Securities Data</h1>
      <Link to="/">Go Back to Homepage</Link>
      <div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Security ID</th>
            <th>Security Long Name</th>
            <th>Security Short Name</th>
          </tr>
        </thead>
        <tbody>
          {securities.map(security => (
            <tr key={security.security_id}>
              <td>{security[0]}</td>
              <td>{security[1]}</td>
              <td>{security[2]}</td>
              <td>
              <a href={`/securities/${security[0]}`}>View Details</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Securities;
