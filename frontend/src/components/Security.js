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
  const [yAxisBounds, setYAxisBounds] = useState({ min: null, max: null });

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
        
        // Set initial Y-axis bounds (before moving average)
        const priceValues = formattedPriceHistories.map(history => history.price);
        const yAxisMin = Math.min(...priceValues);
        const yAxisMax = Math.max(...priceValues);
        setYAxisBounds({ min: yAxisMin, max: yAxisMax });
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

  // Calculate Moving Average
  const calculateMovingAverage = (data, period) => {
    let movingAverageData = new Array(period - 1).fill(null); // Fill initial values with null
    for (let i = period - 1; i < data.length; i++) {
      const window = data.slice(i - period + 1, i + 1);
      const average = window.reduce((sum, value) => sum + value.price, 0) / period;
      movingAverageData.push(average);
    }
    return movingAverageData;
  };

  // Define period for selected moving average
  const movingAveragePeriod =
    selectedAverage === '5d' ? 5 :
    selectedAverage === '40d' ? 40 :
    selectedAverage === '200d' ? 200 :
    null;

  const movingAverageValues = movingAveragePeriod
    ? calculateMovingAverage(priceHistories, movingAveragePeriod)
    : [];

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

  // Filter price histories based on the selected timeframe
  const getFilteredPriceHistories = (timeFrame) => {
    const multiplier = getTimeFrameMultiplier(timeFrame);
    const filteredHistories = priceHistories.filter((_, index) => index % multiplier === 0);
    
    // Adjust x-axis labels for the filtered data
    const labels = filteredHistories.map(history => {
      if (timeFrame === 'annually') {
        return new Date(history.date).getFullYear(); // Display only year for annual data
      } else if (timeFrame === 'monthly') {
        return new Date(history.date).toLocaleString('default', { month: 'short', year: 'numeric' }); // Display month and year for monthly data
      }
      return history.date; // Default for daily and other timeframes
    });

    return { filteredHistories, labels };
  };

  const { filteredHistories, labels } = getFilteredPriceHistories(selectedTimeFrame);

  // Chart Data
  const data = {
    labels: labels,
    datasets: [
      {
        label: `Price History for ${securityLongName}`,
        data: filteredHistories.map(history => history.price),
        borderColor: '#00796b', // Green Line (Price History)
        backgroundColor: 'rgba(0, 255, 179, 0.2)',
        borderWidth: 1,
        pointRadius: 0.5,
        fill: false,
      },
      selectedAverage && {
        label: `${movingAveragePeriod}-Day Moving Average`,
        data: movingAverageValues.slice(0, filteredHistories.length), // Adjust moving average data length to match filtered data
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
        suggestedMin: yAxisBounds.min, // Always use the fixed Y-axis min value
        suggestedMax: yAxisBounds.max, // Always use the fixed Y-axis max value
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
