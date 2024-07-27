import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';
import './CryptoCurrency.css';

// Register the necessary chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement
);

function CryptoCurrency() {
  const { ticker } = useParams();
  const [priceHistory, setPriceHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPriceHistory() {
      try {
        const response = await axios.get(`http://localhost:5000/api/crypto-price-history/${ticker}`);
        setPriceHistory(response.data);
      } catch (err) {
        console.error('Error fetching price history:', err);
        setError('Failed to load price history.');
      }
    }
    fetchPriceHistory();
  }, [ticker]);

  const formatChartData = () => {
    return {
      datasets: [{
        label: `${ticker} Price History`,
        data: priceHistory.map(entry => ({
          x: new Date(entry.Date),
          o: entry.Open,
          h: entry.High,
          l: entry.Low,
          c: entry.Close
        })),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        barThickness: 2,
        barPercentage: 0.5, // Adjust this value to change candlestick width
        categoryPercentage: 0.1, // Ensure spacing is uniform
      }]
    };
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgb(0, 255, 179)', // Change legend label color to the specified color
          font: {
            size: 14 // Optionally adjust the font size if needed
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(tooltipItem) {
            const { o, h, l, c } = tooltipItem.raw;
            return `O: ${o} H: ${h} L: ${l} C: ${c}`;
          }
        },
        titleColor: 'rgb(0, 255, 179)', // Change tooltip title color to the specified color
        bodyColor: 'rgb(0, 255, 179)', // Change tooltip body color to the specified color
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'month'
        },
        title: {
          display: true,
          text: 'Date',
          color: 'rgb(0, 255, 179)' // Change x-axis title color to the specified color
        },
        ticks: {
          color: 'rgb(0, 255, 179)' // Change x-axis ticks color to the specified color
        }
      },
      y: {
        title: {
          display: true,
          text: 'Price',
          color: 'rgb(0, 255, 179)' // Change y-axis title color to the specified color
        },
        ticks: {
          color: 'rgb(0, 255, 179)' // Change y-axis ticks color to the specified color
        }
      }
    }
  };

  return (
    <div className="crypto-detail-container">
      {error ? (
        <div>{error}</div>
      ) : (
        <Chart type="candlestick" data={formatChartData()} options={options} />
      )}
    </div>
  );
}

export default CryptoCurrency;
