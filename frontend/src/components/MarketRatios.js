import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // Import Link from react-router-dom
import './MarketRatios.css'; // Import the CSS file

function MarketRatios() {
  const [marketRatios, setMarketRatios] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/market-ratios')
      .then(response => {
        setMarketRatios(response.data);
      })
      .catch(error => {
        console.error('Error fetching market ratios:', error);
      });
  }, []);

  const handleRowClick = (id) => {
    navigate(`/market-ratios/${id}`);
  };

  return (
    <div className='market-ratios-container'>
      <h1 className='market-ratios-header'>Market Ratios Data</h1>
      <table>
        <thead>
          <tr>
            <th>Ratio ID</th>
            <th>Ratio Name</th>
          </tr>
        </thead>
        <tbody>
          {marketRatios.map(ratio => (
            <tr key={ratio.ratio_id} onClick={() => handleRowClick(ratio[0])} className='clickable-row'>
              <td>{ratio[0]}</td>
              <td>{ratio[1]}</td>
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

export default MarketRatios;
