import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './MarketRatios.css';

function MarketRatios() {
  const [marketRatios, setMarketRatios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMarketRatios, setFilteredMarketRatios] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/market-ratios`)
      .then(response => {
        if (Array.isArray(response.data)) {
          setMarketRatios(response.data);
        } else {
          console.error('Unexpected data format:', response.data);
        }
      })
      .catch(error => {
        console.error('Error fetching market ratios:', error);
      });
  }, []);

  useEffect(() => {
    if (Array.isArray(marketRatios)) {
      setFilteredMarketRatios(
        marketRatios.filter(marketRatio =>
          (marketRatio[1] && marketRatio[1].toLowerCase().includes(searchTerm.toLowerCase())) ||
          (marketRatio[2] && marketRatio[2].toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }
  }, [searchTerm, marketRatios]);

  const handleRowClick = (id) => {
    navigate(`/market-ratios/${id}`);
  };

  return (
    <div className='market-ratios-container'>
      <div className='search-container'>
        <input
          type='text'
          placeholder='Search market ratios...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='search-input'
        />
      </div>

      <table>
        <thead>
          <tr>
            <th>Ratio ID</th>
            <th>Ratio Name</th>
          </tr>
        </thead>
        <tbody>
          {filteredMarketRatios.length > 0 ? (
            filteredMarketRatios.map(ratio => (
              <tr key={ratio[0]} onClick={() => handleRowClick(ratio[0])} className='clickable-row'>
                <td>{ratio[0] || 'N/A'}</td>
                <td>{ratio[1] || 'N/A'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan='2'>No market ratios found</td>
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

export default MarketRatios;
