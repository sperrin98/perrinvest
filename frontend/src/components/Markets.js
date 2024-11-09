import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Markets.css'; // Optional: Create a CSS file for styling

function Markets() {
  const [markets, setMarkets] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/markets`);
        console.log(response.data); // Log the data to inspect its structure
        setMarkets(response.data);
      } catch (err) {
        console.error('Error fetching markets:', err);
        setError('Failed to load markets.');
      }
    };

    fetchMarkets();
  }, []);

  return (
    <div className="markets-container">
      <h1>Markets</h1>
      {error && <div className="error-message">{error}</div>}
      {markets.length > 0 ? (
        <table className='markets-table'>
          <thead>
            <tr>
              <th>Market ID</th>
              <th>Market Name</th>
              <th>Market Description</th>
              {/* Add more headers based on your markets structure */}
            </tr>
          </thead>
          <tbody>
            {markets.map(market => (
              <tr key={market.market_id}>
                <td>{market.market_id}</td>
                <td>{market.market_name}</td>
                <td>{market.market_description}</td>
                {/* Add more cells based on your markets structure */}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>No markets found.</div>
      )}
    </div>
  );
}

export default Markets;
