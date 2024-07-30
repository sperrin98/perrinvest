import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './CryptoCurrencies.css'; // Import the CSS file

function CryptoCurrencies() {
  const [cryptocurrencies, setCryptocurrencies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCryptocurrencies, setFilteredCryptocurrencies] = useState([]);
  const navigate = useNavigate();
  const [error, setError] = useState(null);  // Define the error state

  useEffect(() => {
    async function fetchCryptocurrencies() {
      try {
        const response = await axios.get('http://localhost:5000/api/crypto-prices');
        console.log(response.data);  // Log the data to inspect its structure
        setCryptocurrencies(response.data);
      } catch (err) {
        console.error('Error fetching cryptocurrencies:', err);
        setError('Failed to load cryptocurrencies.');
      }
    }
    fetchCryptocurrencies();
  }, []);

  // Update filtered cryptocurrencies whenever searchTerm changes
  useEffect(() => {
    setFilteredCryptocurrencies(
      Object.entries(cryptocurrencies).filter(([ticker, data]) =>
        ticker.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, cryptocurrencies]);

  const handleRowClick = (ticker) => {
    navigate(`/currencies/crypto/${ticker}`);
  };

  return (
    <div className="cryptocurrencies-container">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search cryptocurrencies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      <table className='cryptocurrencies-table'>
        <thead>
          <tr>
            <th className='ticker-header'>Ticker</th>
            <th className="price-header">Last Close Price</th>
          </tr>
        </thead>
        <tbody>
          {error && <tr><td colSpan="2">{error}</td></tr>}
          {filteredCryptocurrencies.length > 0 ? (
            filteredCryptocurrencies.map(([ticker, data]) => (
              <tr key={ticker} onClick={() => handleRowClick(ticker)} className="clickable-row">
                <td className="ticker-column">{ticker}</td>
                <td>
                  {data && data.length > 0 ? `$${data[data.length - 1]?.Close?.toFixed(2) || 'N/A'}` : 'N/A'}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2">No cryptocurrencies found</td>
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

export default CryptoCurrencies;
