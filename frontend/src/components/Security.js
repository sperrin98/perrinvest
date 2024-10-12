import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './Security.css';  // Ensure this path is correct
import useIsMobile from './useIsMobile';  // Ensure this path is correct

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, Title, Tooltip, Legend);

const Security = () => {
  const { id } = useParams(); // Get the security ID from URL
  const [security, setSecurity] = useState(null);
  const [priceHistories, setPriceHistories] = useState([]);
  const [timeframe, setTimeframe] = useState('all');  // Default timeframe to 'all'
  const [movingAverageData, setMovingAverageData] = useState([]);
  const [selectedAverage, setSelectedAverage] = useState('5d'); // Default to 5-day moving average
  const [isLogScale, setIsLogScale] = useState(false); // State to toggle between linear and logarithmic scale
  const isMobile = useIsMobile(); // Use the custom hook

  // Fetch security details and price histories
  useEffect(() => {
    const fetchSecurity = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/securities/${id}`);
        console.log('Fetched Security Data:', response.data); // Log the response data
        setSecurity(response.data.security); // Set the fetched security
      } catch (error) {
        console.error('Error fetching security:', error);
      }
    };

    const fetchPriceHistories = async () => {
      try {
        // Make the API call based on the selected timeframe
        const response = await axios.get(`http://localhost:5000/securities/${id}/price-histories?timeframe=${timeframe}`);
        
        // Format the data correctly
        const formattedPriceHistories = response.data.map(history => ({
          date: new Date(history[1]).toISOString().split('T')[0],
          price: history[2],
        }));
        setPriceHistories(formattedPriceHistories); // Set the fetched price histories
      } catch (error) {
        console.error('Error fetching price histories:', error);
      }
    };

    fetchSecurity();
    fetchPriceHistories();
  }, [id, timeframe]);  // Re-fetch data when the timeframe changes

  // Handle loading state
  if (!security) {
    return <div>Loading...</div>;
  }

  // Access the security long name from the security array
  const securityLongName = security[1]; // Assuming security_long_name is the second item in the array

  const prices = priceHistories.map(history => history.price);

  // Data for the price history chart
  const data = {
    labels: priceHistories.map(history => history.date),
    datasets: [{
      label: `Price History for ${securityLongName || "Unknown Security"}`, // Use the correct long name
      data: prices,
      borderColor: 'rgb(0, 255, 179)',
      backgroundColor: 'rgba(0, 255, 179, 0.2)',
      borderWidth: 1,   // Thinner line
      pointRadius: 0.5, // Smaller points
      fill: false,
    }],
  };

  // Calculate moving average
  const calculateMovingAverage = (data, period) => {
    let movingAverageData = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        movingAverageData.push(null);  // Not enough data for this period
      } else {
        const window = data.slice(i - period + 1, i + 1);
        const average = window.reduce((sum, value) => sum + value.price, 0) / period;
        movingAverageData.push(average);
      }
    }
    return movingAverageData;
  };

  // Determine the moving average period based on the selected average
  const movingAveragePeriod = selectedAverage === '5d' ? 5 : selectedAverage === '40d' ? 40 : 200;

  // Calculate the moving average dataset
  const movingAverageValues = calculateMovingAverage(priceHistories, movingAveragePeriod);

  // Data for the moving average chart
  const movingAverageChartData = {
    labels: priceHistories.map(history => history.date),
    datasets: [{
      label: `${movingAveragePeriod}-Day Moving Average`,
      data: movingAverageValues,
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      borderWidth: 1,
      pointRadius: 0.5,
      fill: false,
    }],
  };

  // Chart options with toggle for linear/logarithmic scale
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          color: 'rgb(0, 255, 179)',
        },
        ticks: {
          color: 'rgb(0, 255, 179)',
        },
        grid: {
          color: 'rgb(68, 68, 68)',
        },
      },
      y: {
        type: isLogScale ? 'logarithmic' : 'linear', // Toggle between logarithmic and linear
        title: {
          display: true,
          text: 'Price',
          color: 'rgb(0, 255, 179)',
        },
        ticks: {
          color: 'rgb(0, 255, 179)',
          beginAtZero: true, // Ensure the y-axis starts at zero
        },
        grid: {
          color: 'rgb(68, 68, 68)',
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgb(0, 255, 179)',
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Price: ${context.raw}`;
          },
        },
        titleColor: 'rgb(0, 255, 179)',
        bodyColor: 'rgb(0, 255, 179)',
      },
    },
  };

  return (
    <div className='security-container'>
      {/* Timeframe dropdown */}
      <div className='timeframe-dropdown'>
        <h3>Select Timeframe</h3>
        <select
          id="timeframe"
          value={timeframe}
          onChange={e => setTimeframe(e.target.value)}
        >
          <option value="all">All</option>
          <option value="1w">1 Week</option>
          <option value="1m">1 Month</option>
          <option value="3m">3 Months</option>
          <option value="1y">1 Year</option>
          <option value="ytd">YTD (Year-to-Date)</option> {/* New Option */}
          <option value="5y">5 Years</option> {/* New Option */}
        </select>
      </div>

      <h2>{securityLongName || "Unknown Security"}</h2>

      {/* Toggle between linear/logarithmic scale */}
      <div className='toggle-button-container'>
        <button onClick={() => setIsLogScale(!isLogScale)}>
          Switch to {isLogScale ? 'Linear' : 'Logarithmic'} Scale
        </button>
      </div>

      {/* Price history chart */}
      <div className='chart-wrapper'>
        <Line data={data} options={chartOptions} />
      </div>

      {/* Moving Averages Section */}
      <div className="average-dropdown" style={{ textAlign: 'center' }}>
        <h3>Select Moving Average</h3>
        <select
          id="average"
          value={selectedAverage}
          onChange={e => setSelectedAverage(e.target.value)}
        >
          <option value="5d">5-Day Moving Average</option>
          <option value="40d">40-Day Moving Average</option>
          <option value="200d">200-Day Moving Average</option>
        </select>
      </div>

      {/* Moving average chart */}
      <div className="chart-wrapper">
        <Line data={movingAverageChartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default Security;
