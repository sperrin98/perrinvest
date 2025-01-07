import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const NwHpi = () => {
  const { id } = useParams(); // Get the `id` parameter from the URL
  const [hpiData, setHpiData] = useState([]); // State to store fetched data
  const [error, setError] = useState(null); // State to handle any errors

  useEffect(() => {
    const fetchHpiData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/nw-hpi/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        setHpiData(data);  // Store the data in the state
        console.log('Fetched Data:', data);  // Log the data for debugging
      } catch (err) {
        setError(err.message);  // Handle any errors
      }
    };

    fetchHpiData();  // Call the function to fetch data when the component mounts
  }, [id]); // Re-run this effect if the `id` parameter changes

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!hpiData.length) {
    return <div>Loading...</div>;
  }

  // Helper function to format the date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(); // Format as a more readable date
  };

  return (
    <div className="nw-hpi-container">
      <h2>Nationwide House Price Index (HPI) for ID: {id}</h2>
      
      {/* Render the table if data is available */}
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>HPI</th>
            <th>Gold_GBP</th>
            <th>HPI_PRICE_IN_GOLD</th>
            <th>HPI_INDEXED</th>
            <th>HPI_PRICE_IN_GOLD_INDEX</th>
          </tr>
        </thead>
        <tbody>
          {hpiData.map((row, index) => (
            <tr key={index}>
              <td>{formatDate(row.Date)}</td>  {/* Format the date */}
              <td>{parseFloat(row.HPI).toFixed(2)}</td>  {/* Convert string to float */}
              <td>{parseFloat(row.Gold_GBP).toFixed(2)}</td>  {/* Convert string to float */}
              <td>{row.HPI_PRICE_IN_GOLD.toFixed(2)}</td>  {/* Keep this as a number */}
              <td>{parseFloat(row.NW_HPI_INDEXED).toFixed(2)}</td>  {/* Convert string to float */}
              <td>{row.NW_HPI_PRICE_IN_GOLD_INDEXED.toFixed(2)}</td>  {/* Keep this as a number */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NwHpi;
