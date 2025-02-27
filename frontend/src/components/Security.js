import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';  
import './Security.css';

ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin);

const Security = () => {
  const { id } = useParams();
  const [security, setSecurity] = useState(null);
  const [priceHistories, setPriceHistories] = useState([]);
  const [selectedAverage, setSelectedAverage] = useState(null); // Default: No moving average
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('daily'); // Default: Daily
  const [isLogScale, setIsLogScale] = useState(false);

  useEffect(() => {
    const fetchSecurity = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/securities/${id}`);
        setSecurity(response.data.security);
      } catch (error) {
        console.error('Error fetching security:', error);
      }
    };

    const fetchPriceHistories = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/securities/${id}/price-histories`);
        const formattedPriceHistories = response.data.map(history => ({
          date: new Date(history[1]).toISOString().split('T')[0],
          price: history[2],
        }));
        setPriceHistories(formattedPriceHistories);
      } catch (error) {
        console.error('Error fetching price histories:', error);
      }
    };

    fetchSecurity();
    fetchPriceHistories();
  }, [id]);

  if (!security) {
    return <div>Loading...</div>;
  }

  const securityLongName = security[1];

  // Timeframe filtering logic
  const getTimeFrameMultiplier = (timeFrame) => {
    switch(timeFrame) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30;
      case 'quarterly': return 90;
      case 'annually': return 365;
      default: return 1;
    }
  };

  // Filter the price history based on selected timeframe
  const filteredPriceHistories = priceHistories.slice(0, priceHistories.length / getTimeFrameMultiplier(selectedTimeFrame));

  // Calculate min and max for the price history data (this will not be affected by the moving average)
  const priceValues = filteredPriceHistories.map(history => history.price);
  const yAxisMin = Math.min(...priceValues);
  const yAxisMax = Math.max(...priceValues);

  // Prepare the filtered moving average values based on selected timeframe
  const calculateMovingAverageForTimeframe = (timeFrame) => {
    const movingAverageData = [];
    for (let i = 0; i < filteredPriceHistories.length; i++) {
      const windowSize = timeFrame === 'daily' ? 5 : timeFrame === 'weekly' ? 5 * 7 : timeFrame === 'monthly' ? 5 * 30 : 5;
      if (i >= windowSize - 1) {
        const window = filteredPriceHistories.slice(i - windowSize + 1, i + 1);
        const avg = window.reduce((sum, data) => sum + data.price, 0) / window.length;
        movingAverageData.push(avg);
      } else {
        movingAverageData.push(null);
      }
    }
    return movingAverageData;
  };

  // Get the moving average values based on the selected timeframe
  const movingAverageValues = selectedAverage ? calculateMovingAverageForTimeframe(selectedTimeFrame) : [];

  // Chart Data
  const data = {
    labels: filteredPriceHistories.map(history => history.date),
    datasets: [
      {
        label: `Price History for ${securityLongName}`,
        data: filteredPriceHistories.map(history => history.price),
        borderColor: '#00796b', // Green Line (Price History)
        backgroundColor: 'rgba(0, 255, 179, 0.2)',
        borderWidth: 1,
        pointRadius: 0.5,
        fill: false,
      },
      selectedAverage && {
        label: `${selectedAverage}-Day Moving Average`,
        data: movingAverageValues,
        borderColor: 'rgb(255, 99, 132)', // Red Line (Moving Average)
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 1,
        pointRadius: 0.5,
        fill: false,
      },
    ].filter(Boolean),
  };

  // Chart Options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      x: {
        title: { display: true, text: 'Date', color: '#00796b' },
        ticks: { color: '#00796b' },
        grid: { color: 'rgb(68, 68, 68)' },
      },
      y: {
        type: isLogScale ? 'logarithmic' : 'linear',
        title: { display: true, text: 'Price', color: '#00796b' },
        ticks: { color: '#00796b', beginAtZero: false },
        grid: { color: 'rgb(68, 68, 68)' },
        suggestedMin: yAxisMin, // Adjust the min value based on filtered price history
        suggestedMax: yAxisMax, // Adjust the max value based on filtered price history
      },
    },
    plugins: {
      legend: { labels: { color: '#00796b' } },
      zoom: {
        zoom: { wheel: { enabled: true }, pinch: { enabled: true } },
        pan: { enabled: true, mode: 'xy' },
      },
    },
  };

  return (
    <div className='security-container'>
      <div className="sidebar">
        {/* Time Period Selection */}
        <h3>Time Period</h3>
        {['daily', 'weekly', 'monthly', 'quarterly', 'annually'].map(time => (
          <button
            key={time}
            onClick={() => setSelectedTimeFrame(time)}
            className={selectedTimeFrame === time ? 'selected' : ''}
          >
            {time.charAt(0).toUpperCase() + time.slice(1)}
          </button>
        ))}

        {/* Moving Averages Selection */}
        <h3>Moving Averages</h3>
        {['5d', '40d', '200d'].map(avg => (
          <button
            key={avg}
            onClick={() => setSelectedAverage(avg === selectedAverage ? null : avg)}
            className={selectedAverage === avg ? 'selected' : ''}
          >
            {avg}
          </button>
        ))}

        {/* Scale Selection */}
        <h3>Scale</h3>
        <button
          onClick={() => setIsLogScale(false)}
          className={!isLogScale ? 'selected' : ''}
        >
          Linear
        </button>
        <button
          onClick={() => setIsLogScale(true)}
          className={isLogScale ? 'selected' : ''}
        >
          Logarithmic
        </button>
      </div>

      <div className="main-content">
        <h2 className='security-hdr'>{securityLongName || "Unknown Security"}</h2>
        <div className="chart-wrapper">
          <Line data={data} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default Security;
