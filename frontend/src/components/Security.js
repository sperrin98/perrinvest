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
  const [selectedAverage, setSelectedAverage] = useState('5d');
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [isLogScale, setIsLogScale] = useState(false);
  const [showMovingAverage, setShowMovingAverage] = useState(false);

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

  const aggregateDataByPeriod = (data, period) => {
    if (period === 'daily') return data; // No aggregation needed for daily
    const aggregatedData = [];
    let currentGroup = { date: "", prices: [] };

    data.forEach(item => {
      const currentDate = new Date(item.date);
      let periodStart;

      switch (period) {
        case 'weekly':
          periodStart = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay())); // Set to Sunday
          break;
        case 'monthly':
          periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // Set to first day of month
          break;
        case 'quarterly':
          periodStart = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1); // Set to first day of quarter
          break;
        case 'annually':
          periodStart = new Date(currentDate.getFullYear(), 0, 1); // Set to first day of year
          break;
        default:
          periodStart = currentDate; // Default is daily
      }

      const formattedDate = periodStart.toISOString().split('T')[0]; // formatted date for the group
      if (currentGroup.date === formattedDate) {
        currentGroup.prices.push(item.price);
      } else {
        if (currentGroup.date) {
          const avgPrice = currentGroup.prices.reduce((acc, price) => acc + price, 0) / currentGroup.prices.length;
          aggregatedData.push({ date: currentGroup.date, price: avgPrice });
        }
        currentGroup = { date: formattedDate, prices: [item.price] };
      }
    });

    if (currentGroup.date) {
      const avgPrice = currentGroup.prices.reduce((acc, price) => acc + price, 0) / currentGroup.prices.length;
      aggregatedData.push({ date: currentGroup.date, price: avgPrice });
    }

    return aggregatedData;
  };

  const calculateMovingAverage = (data, period) => {
    let movingAverageData = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        movingAverageData.push(null);
      } else {
        const window = data.slice(i - period + 1, i + 1);
        const average = window.reduce((sum, value) => sum + value.price, 0) / period;
        movingAverageData.push(average);
      }
    }
    return movingAverageData;
  };

  const periodMapping = {
    '5d': 5,
    '40d': 40,
    '200d': 200,
    'weekly': 7, // Weekly is considered 7 days
    'monthly': 30, // Monthly is approximately 30 days
    'quarterly': 90, // Quarterly is approximately 90 days
    'annually': 365, // Annually is approximately 365 days
  };

  const aggregatedPriceHistories = aggregateDataByPeriod(priceHistories, selectedPeriod);
  const movingAveragePeriod = periodMapping[selectedAverage] || periodMapping[selectedPeriod];
  const movingAverageValues = calculateMovingAverage(aggregatedPriceHistories, movingAveragePeriod);

  const data = {
    labels: aggregatedPriceHistories.map(history => history.date),
    datasets: [
      {
        label: `Price History for ${security?.[1]}`,
        data: aggregatedPriceHistories.map(history => history.price),
        borderColor: '#00796b',
        backgroundColor: 'rgba(0, 255, 179, 0.2)',
        borderWidth: 1,
        pointRadius: 0.5,
        fill: false,
      },
      showMovingAverage && {
        label: `${movingAveragePeriod}-Day Moving Average`,
        data: movingAverageValues,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 1,
        pointRadius: 0.5,
        fill: false,
      },
    ].filter(Boolean),
  };

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
        ticks: { color: '#00796b', beginAtZero: true },
        grid: { color: 'rgb(68, 68, 68)' },
      },
    },
    plugins: {
      legend: { labels: { color: '#00796b' } },
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
        zoom: { wheel: { enabled: true }, pinch: { enabled: true } },
        pan: { enabled: true, mode: 'xy' },
      },
    },
  };

  return (
    <div className='security-container'>
      <h2>{security?.[1] || "Unknown Security"}</h2>

      {/* Toggle buttons */}
      <div className='toggle-button-container'>
        <button onClick={() => setIsLogScale(!isLogScale)}>
          Switch to {isLogScale ? 'Linear' : 'Logarithmic'} Scale
        </button>
      </div>

      {/* Moving Averages Section */}
      <div className="moving-averages-section">
        <h3 className="moving-averages-title">Moving Averages</h3>
        <div className="moving-average-dropdown" style={{ textAlign: 'center' }}>
          <label>
            <input
              type="checkbox"
              checked={showMovingAverage}
              onChange={() => setShowMovingAverage(!showMovingAverage)}
            />
            Show Moving Average
          </label>
          <select
            id="average"
            value={selectedAverage}
            onChange={e => setSelectedAverage(e.target.value)}
            disabled={!showMovingAverage}
          >
            <option value="5d">5-Day Moving Average</option>
            <option value="40d">40-Day Moving Average</option>
            <option value="200d">200-Day Moving Average</option>
          </select>
        </div>
      </div>

      {/* Time period selection */}
      <div className="time-period-section">
        <h3>Select Time Period</h3>
        <select
          id="time-period"
          value={selectedPeriod}
          onChange={e => setSelectedPeriod(e.target.value)}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annually">Annually</option>
        </select>
      </div>

      {/* Price history chart with optional moving average */}
      <div className='chart-wrapper'>
        <Line data={data} options={chartOptions} />
      </div>
    </div>
  );
};

export default Security;
