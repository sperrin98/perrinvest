import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Returns = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);  // Error state

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get('http://localhost:5000/returns');  
        console.log('Response:', response.data);  
        setData(response.data);
      } catch (err) {
        console.error('Error fetching returns:', err);  // Log the error object
        console.error('Error details:', err.response ? err.response.data : err.message);
        setError('Failed to load returns data.');  
      }
    }
    fetchData();
  }, []);
  

  return (
    <div className="returns-container">
      <h1>Annual GLD Price in Major Currencies</h1>
      {error && <div className="error-message">{error}</div>}  // Display error if exists
      <table className='returns-table'>
        <thead>
          <tr>
            <th>Year</th>
            <th>EUR</th>
            <th>GBP</th>
            <th>NOK</th>
            <th>JPY</th>
            <th>CAD</th>
            <th>AUD</th>
            <th>NZD</th>
            <th>CHF</th>
            <th>BRL</th>
            <th>MXN</th>
            <th>ZAR</th>
            <th>CNY</th>
            <th>IDR</th>
            <th>INR</th>
            <th>KRW</th>
            <th>MYR</th>
            <th>SGD</th>
            <th>CZK</th>
            <th>PLN</th>
            <th>HUF</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, index) => (
              <tr key={index}>
                <td>{row.yr}</td>
                <td>{row.EUR}</td>
                <td>{row.GBP}</td>
                <td>{row.NOK}</td>
                <td>{row.JPY}</td>
                <td>{row.CAD}</td>
                <td>{row.AUD}</td>
                <td>{row.NZD}</td>
                <td>{row.CHF}</td>
                <td>{row.BRL}</td>
                <td>{row.MXN}</td>
                <td>{row.ZAR}</td>
                <td>{row.CNY}</td>
                <td>{row.IDR}</td>
                <td>{row.INR}</td>
                <td>{row.KRW}</td>
                <td>{row.MYR}</td>
                <td>{row.SGD}</td>
                <td>{row.CZK}</td>
                <td>{row.PLN}</td>
                <td>{row.HUF}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="21">No data available.</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="back-button-container">
        <Link to="/" className="back-button">Go Back to Homepage</Link>
      </div>
    </div>
  );
};

export default Returns;
