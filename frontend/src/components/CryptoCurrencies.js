import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CryptoCurrencies.css';

function CryptoCurrencies() {
  const [cryptoData, setCryptoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/crypto-prices')
      .then(response => {
        setCryptoData(response.data);
        setLoading(false);
      })
      .catch(error => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="crypto-container">
      <h2>Cryptocurrency Data</h2>
      <div className="crypto-table">
        {cryptoData && Object.entries(cryptoData).map(([ticker, data]) => (
          <div key={ticker} className="crypto-item">
            <h3>{ticker}</h3>
            <ul>
              {data.map((item, index) => (
                <li key={index}>
                  Date: {new Date(item.Date).toLocaleDateString()} - Close: ${item.Close.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CryptoCurrencies;
