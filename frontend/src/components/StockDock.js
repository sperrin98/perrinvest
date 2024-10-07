import axios from 'axios';
import React, { useEffect, useState } from 'react';
import './StockDock.css'; // Ensure the CSS is imported

const StockDock = () => {
  const [data, setData] = useState({});

  const fetchStockPrices = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/stock-prices');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };

  useEffect(() => {
    fetchStockPrices();
  }, []);

  return (
    <div className="stock-dock">
      {Object.keys(data).length === 0 ? (
        <p>Loading...</p>
      ) : (
        Object.entries(data).map(([name, { current_price, previous_price }]) => {
          // Determine the price trend
          const priceTrendClass = current_price > previous_price ? 'price-up' : 'price-down';

          return (
            <div key={name} className="stock-item">
              <div className="stock-name">{name}</div>
              <div className={`stock-price ${priceTrendClass}`}>
                ${current_price.toFixed(2)}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default StockDock;
