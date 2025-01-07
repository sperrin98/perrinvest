import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './NwHpi.css';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Registering necessary chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const NwHpi = () => {
  const { id } = useParams(); // Get the `id` parameter from the URL
  const [hpiData, setHpiData] = useState([]); // State to store fetched data
  const [error, setError] = useState(null); // State to handle any errors
  const [showData, setShowData] = useState(false); // State to toggle visibility of the table

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

  // Helper function to format the date as YYYY-MM-DD
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Ensure two digits for month
    const day = date.getDate().toString().padStart(2, '0'); // Ensure two digits for day
    return `${year}-${month}-${day}`; // Format as YYYY-MM-DD
  };

  // Prepare data for the line chart
  const chartData = {
    labels: hpiData.map(row => formatDate(row.Date)),
    datasets: [
      {
        label: 'HPI Indexed',
        data: hpiData.map(row => parseFloat(row.NW_HPI_INDEXED)),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        yAxisID: 'y',
        fill: false,
        tension: 0.1,
      },
      {
        label: 'HPI Price in Gold Indexed',
        data: hpiData.map(row => parseFloat(row.NW_HPI_PRICE_IN_GOLD_INDEXED)),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        yAxisID: 'y1',
        fill: false,
        tension: 0.1,
      },
    ],
  };

  // Chart options with secondary Y-axis
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Fixes chart resizing/shaking
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'HPI Indexed',
        },
      },
      y1: {
        type: 'linear',
        position: 'right',
        title: {
          display: true,
          text: 'HPI Price in Gold Indexed',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  const handleShowDataClick = () => {
    setShowData(!showData);  // Toggle the visibility of the table
  };

  return (
    <div className="nw-hpi-container">
      <h2>Nationwide House Price Index (HPI) for ID: {id}</h2>

      {/* Line chart */}
      <div className="chart-container">
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Button to toggle visibility of the table */}
      <button onClick={handleShowDataClick}>
        {showData ? 'Hide Data' : 'See Data'}
      </button>

      {/* Render the table if data is available and showData is true */}
      {showData && (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>HPI</th>
              <th>Gold Price</th>
              <th>HPI Price in Gold</th>
              <th>HPI Indexed</th>
              <th>HPI Price in Gold Indexed</th>
            </tr>
          </thead>
          <tbody>
            {hpiData.map((row, index) => (
              <tr key={index}>
                <td>{formatDate(row.Date)}</td> {/* Format the date */}
                <td>{parseFloat(row.HPI).toFixed(2)}</td> {/* Convert string to float */}
                <td>{parseFloat(row.Gold_GBP).toFixed(2)}</td> {/* Convert string to float */}
                <td>{row.HPI_PRICE_IN_GOLD.toFixed(2)}</td> {/* Keep this as a number */}
                <td>{parseFloat(row.NW_HPI_INDEXED).toFixed(2)}</td> {/* Convert string to float */}
                <td>{row.NW_HPI_PRICE_IN_GOLD_INDEXED.toFixed(2)}</td> {/* Keep this as a number */}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default NwHpi;
