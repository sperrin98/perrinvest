// frontend/src/components/MarketRatio.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

function MarketRatio({ marketRatioId }) {
  const [marketRatio, setMarketRatio] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/market-ratios/${marketRatioId}`)
      .then(response => {
        setMarketRatio(response.data);
      })
      .catch(error => {
        console.error('Error fetching market ratio:', error);
      });
  }, [marketRatioId]);

  if (!marketRatio) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{marketRatio.name}</h1>
      <p>Value: {marketRatio.value}</p>
    </div>
  );
}

export default MarketRatio;

