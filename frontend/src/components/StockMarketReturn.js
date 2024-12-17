import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/securities/returns/${id}`, { signal }); // Pass the signal
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

  // Transform data to make it compatible with the chart
  const chartData = data
    .map(item => ({
      date: new Date(item.price_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      securityPrice: item.security_price,
      goldPrice: item.price_in_gold,
    }))
    .reverse(); // Reverse the order so the most recent date is on the right

  return (
    <div className='returns-container'>
      {loading && <div>Loading stock market data...</div>} {/* Loading indicator */}
      {error && <div>{`Error: ${error}`}</div>} {/* Error message */}
      {data.length > 0 ? (
        <div>
          <h1>Stock Market Price History</h1>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              
              {/* Primary Y-axis for Security Price */}
              <YAxis
                yAxisId="left"
                label={{ value: 'Security Price', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              
              {/* Secondary Y-axis for Gold Price */}
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: 'Price in Gold', angle: -90, position: 'insideRight' }}
                domain={['auto', 'auto']}
              />
              
              <Tooltip />
              <Legend />

              {/* Line for Security Price (uses left Y-axis) */}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="securityPrice"
                stroke="#8884d8"
                name="Security Price"
                dot={{ r: 0.5}}
              />

              {/* Line for Gold Price (uses right Y-axis) */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="goldPrice"
                stroke="#82ca9d"
                name="Price in Gold"
                dot={{ r: 0.5}}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        !loading && <div>No data available.</div> // Handle empty data state
      )}
    </div>
  );
};

export default StockMarketReturn;
