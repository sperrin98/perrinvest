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
  const [movingAverages, setMovingAverages] = useState({
    '5d': [],
    '40d': [],
    '200d': []
  });
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

    const fetchMovingAverages = async () => {
      try {
        const movingAveragesData = {};

        // Fetch 5d moving average data
        const response5d = await axios.get(`${process.env.REACT_APP_API_URL}/securities/${id}/5d-moving-average`);
        movingAveragesData['5d'] = response5d.data.map(item => ({
          date: new Date(item.price_date).toISOString().split('T')[0],
          movingAverage: item['5d_moving_average'],
        }));

        // Fetch 40d moving average data
        const response40d = await axios.get(`${process.env.REACT_APP_API_URL}/securities/${id}/40d-moving-average`);
        movingAveragesData['40d'] = response40d.data.map(item => ({
          date: new Date(item.price_date).toISOString().split('T')[0],
          movingAverage: item['40d_moving_average'],
        }));

        // Fetch 200d moving average data
        const response200d = await axios.get(`${process.env.REACT_APP_API_URL}/securities/${id}/200d-moving-average`);
        movingAveragesData['200d'] = response200d.data.map(item => ({
          date: new Date(item.price_date).toISOString().split('T')[0],
          movingAverage: item['200d_moving_average'],
        }));

        setMovingAverages(movingAveragesData);
      } catch (error) {
        console.error('Error fetching moving averages:', error);
      }
    };

    fetchSecurity();
    fetchPriceHistories();
    fetchMovingAverages();
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
  const getFilteredPriceHistories = () => {
    const multiplier = getTimeFrameMultiplier(selectedTimeFrame);
    const filtered = [];
    let currentDate = new Date();
    
    // Ensure we are filtering data so the most recent data is shown last, no matter the timeframe
    priceHistories.forEach((history, index) => {
      const date = new Date(history.date);
      const diffInDays = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));
      
      if (diffInDays % multiplier === 0) {
        filtered.push(history);
      }
    });

    return filtered; // Do not reverse the array, it should be sorted from oldest to most recent
  };

  const filteredPriceHistories = getFilteredPriceHistories();

  // Calculate min and max for the price history data (this will not be affected by the moving average)
  const priceValues = filteredPriceHistories.map(history => history.price);
  const yAxisMin = Math.min(...priceValues);
  const yAxisMax = Math.max(...priceValues);

  // Prepare the filtered moving average values based on selected timeframe
  const getMovingAverageValues = (movingAverageType) => {
    const movingAverageData = movingAverages[movingAverageType] || [];
    return movingAverageData.map(item => ({
      date: item.date,
      movingAverage: item.movingAverage,
    }));
  };

  const movingAverageValues5d = selectedAverage === '5d' ? getMovingAverageValues('5d') : [];
  const movingAverageValues40d = selectedAverage === '40d' ? getMovingAverageValues('40d') : [];
  const movingAverageValues200d = selectedAverage === '200d' ? getMovingAverageValues('200d') : [];

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
      selectedAverage === '5d' && {
        label: `5-Day Moving Average`,
        data: filteredPriceHistories.map(history => {
          // For each price history point, match with moving average data
          const matchedAvg = movingAverageValues5d.find(item => item.date === history.date);
          return matchedAvg ? matchedAvg.movingAverage : null;
        }),
        borderColor: 'rgb(255, 99, 132)', // Red Line (Moving Average)
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 1,
        pointRadius: 0.5,
        fill: false,
      },
      selectedAverage === '40d' && {
        label: `40-Day Moving Average`,
        data: filteredPriceHistories.map(history => {
          // For each price history point, match with moving average data
          const matchedAvg = movingAverageValues40d.find(item => item.date === history.date);
          return matchedAvg ? matchedAvg.movingAverage : null;
        }),
        borderColor: 'rgb(255, 159, 64)', // Orange Line (40d)
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderWidth: 1,
        pointRadius: 0.5,
        fill: false,
      },
      selectedAverage === '200d' && {
        label: `200-Day Moving Average`,
        data: filteredPriceHistories.map(history => {
          // For each price history point, match with moving average data
          const matchedAvg = movingAverageValues200d.find(item => item.date === history.date);
          return matchedAvg ? matchedAvg.movingAverage : null;
        }),
        borderColor: 'rgb(153, 102, 255)', // Purple Line (200d)
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
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
        grid: { color: 'rgb(202, 202, 202)' },
        reverse: false,  // Do not reverse the x-axis, it should be ordered correctly
      },
      y: {
        type: isLogScale ? 'logarithmic' : 'linear',
        title: { display: true, text: 'Price', color: '#00796b' },
        ticks: { color: '#00796b', beginAtZero: false },
        grid: { color: 'rgb(202, 202, 202)' },
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