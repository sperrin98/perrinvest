import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StockData = ({ ticker }) => {
  const [stockInfo, setStockInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const response = await axios.get(`/api/stock/${ticker}`);
        setStockInfo(response.data);
        setLoading(false);
      } catch (error) {
        setError(error);
        setLoading(false);
      }
    };

    fetchStockData();
  }, [ticker]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading data: {error.message}</p>;

  return (
    <div>
      <h1>{stockInfo.longName}</h1>
      <p>Current Price: {stockInfo.currentPrice}</p>
      <p>Market Cap: {stockInfo.marketCap}</p>
      {/* Add more stock info as needed */}
    </div>
  );
};

export default StockData;
