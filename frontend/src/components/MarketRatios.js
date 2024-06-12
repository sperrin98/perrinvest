// frontend/src/components/MarketRatios.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
      <h1>Market Ratios</h1>
      <ul>
        {marketRatios.map(ratio => (
          <li key={ratio.id}>
            {ratio[0]}: {ratio[1]}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MarketRatios;
