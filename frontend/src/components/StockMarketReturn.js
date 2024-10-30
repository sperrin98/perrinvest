import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './Returns.css';

const StockMarketReturn = () => {
  const { id } = useParams(); // Get the ID from the URL
  const [data, setData] = useState([]); // State to hold the fetched data
  const [loading, setLoading] = useState(true); // State to handle loading state
  const [error, setError] = useState(null); // State to handle errors

  useEffect(() => {
    const controller = new AbortController(); // Create an abort controller
    const signal = controller.signal; // Get the signal

    const fetchStockMarketData = async () => {
      try {
        console.log(`Fetching data for ID: ${id}`); // Log the ID being fetched
        const response = await fetch(`http://localhost:5000/securities/returns/${id}`, { signal }); // Pass the signal
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const result = await response.json();
        console.log("Fetched data:", result); // Log fetched data
        setData(result); // Store the fetched data in state
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
        } else {
          console.error("Fetch error:", error); // Log any fetch errors
          setError(error.message); // Set error message in state
        }
      } finally {
        setLoading(false); // Set loading to false regardless of outcome
      }
    };

    fetchStockMarketData(); // Call the fetch function

    return () => {
      controller.abort(); // Cleanup function to abort fetch if component unmounts
    };
  }, [id]); // Effect runs when `id` changes

  console.log("Render: data length", data.length); // Log data length on each render

  return (
    <div className='returns-container'>
      {loading && <div>Loading stock market data...</div>} {/* Loading indicator */}
      {error && <div>{`Error: ${error}`}</div>} {/* Error message */}
      {data.length > 0 ? ( // Fallback rendering
        <div>
          <h1>Stock Market Price History</h1>
          <ul>
            {data.map((priceData, index) => (
              <li key={index}>
                Date: {priceData.price_date}, Security Price: {priceData.security_price}, Price in Gold: {priceData.price_in_gold}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        !loading && <div>No data available.</div> // Handle empty data state
      )}
    </div>
  );
};

export default StockMarketReturn; // Ensure this line is correct
