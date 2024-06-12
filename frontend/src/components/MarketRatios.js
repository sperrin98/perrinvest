import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom

function MarketRatios() {
  const [marketRatios, setMarketRatios] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/market-ratios')
      .then(response => {
        setMarketRatios(response.data);
      })
      .catch(error => {
        console.error('Error fetching market ratios:', error);
      });
  }, []);

  return (
    <div>
      <h1>Market Ratios Data</h1>
      <Link to="/">Go Back to Homepage</Link>
      <table>
        <thead>
          <tr>
            <th>Ratio ID</th>
            <th>Ratio Name</th>
          </tr>
        </thead>
        <tbody>
          {marketRatios.map(ratio => (
            <tr key={ratio.ratio_id}>
              <td>{ratio[0]}</td>
              <td>{ratio[1]}</td>
              <a href={`/market-ratios/${ratio[0]}`}>View Details</a>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MarketRatios;
