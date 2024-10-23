import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const StockMarketReturn = () => {
  const { id } = useParams(); // Get the ID from the URL
  const [data, setData] = useState([]); // State to hold the fetched data
  const [loading, setLoading] = useState(true); // State to handle loading state
  const [error, setError] = useState(null); // State to handle errors

  useEffect(() => {
    const fetchStockMarketData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/securities/returns/${id}`); // Updated to new route
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const result = await response.json();
        setData(result); // Store the fetched data in state
      } catch (error) {
        setError(error.message); // Set error message in state
      } finally {
        setLoading(false); // Set loading to false regardless of outcome
      }
    };

    fetchStockMarketData(); // Call the fetch function
  }, [id]); // Effect runs when `id` changes

  // Function to format the date as YYYY-MM-DD
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div>
      {loading && <div>Loading stock market data...</div>} {/* Loading indicator */}
      {error && <div>{`Error: ${error}`}</div>} {/* Error message */}
      {data.length > 0 && (
        <div>
          <h2>Stock Market Price History</h2>
          <ul>
            {data.map((priceData, index) => (
              <li key={index}>
                Date: {formatDate(priceData.price_date)}, Security Price: {priceData.security_price}, Price in Gold: {priceData.price_in_gold}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StockMarketReturn;
