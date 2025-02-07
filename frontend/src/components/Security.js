import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';  // Import the zoom plugin
import './Security.css';  // Ensure this path is correct

// Register Chart.js components and the zoom plugin
ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin);

const Security = () => {
  const { id } = useParams(); // Get the security ID from URL
  const [security, setSecurity] = useState(null);
  const [priceHistories, setPriceHistories] = useState([]);
  const [selectedAverage, setSelectedAverage] = useState('5d'); // Default to 5-day moving average
  const [isLogScale, setIsLogScale] = useState(false); // State to toggle between linear and logarithmic scale

  // Fetch security details and price histories
  useEffect(() => {
    const fetchSecurity = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/securities/${id}`);
        console.log('Fetched Security Data:', response.data); // Log the response data
        setSecurity(response.data.security); // Set the fetched security
      } catch (error) {
        console.error('Error fetching security:', error);
      }
    };

    const fetchPriceHistories = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/securities/${id}/price-histories`);
        
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
  }, [id]);  // Only fetch when the component mounts

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
      borderColor: '#00796b',
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
    maintainAspectRatio: true, // Maintain aspect ratio
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
          color: '#00796b',
        },
        ticks: {
          color: '#00796b',
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
          color: '#00796b',
        },
        ticks: {
          color: '#00796b',
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
          color: '#00796b',
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Price: ${context.raw}`;
          },
        },
        titleColor: '#f8f8f8',
        bodyColor: '#f8f8f8',
      },
      zoom: {
        // Allow zooming with the scroll wheel
        zoom: {
          wheel: {
            enabled: true, // Enable zooming with the wheel
          },
          pinch: {
            enabled: true, // Enable pinch zooming on touch devices
          },
        },
        pan: {
          enabled: true,
          mode: 'xy', // Allow panning in both directions
        },
      },
    },
  };

  return (
    <div className='security-container'>
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
      <div className="moving-averages-section">
        <h3 className="moving-averages-title">Moving Averages</h3>
        <div className="moving-average-dropdown" style={{ textAlign: 'center' }}>
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
      </div>

      {/* Moving average chart */}
      <div className="chart-wrapper">
        <Line data={movingAverageChartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default Security;
