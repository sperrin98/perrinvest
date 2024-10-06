import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './MarketRatios.css';
import useIsMobile from './useIsMobile'; // Ensure the path is correct

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const MarketRatio = () => {
  const { id } = useParams();
  const [ratioData, setRatioData] = useState([]);
  const [ratioName, setRatioName] = useState('');
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchMarketRatioData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/market-ratios/${id}`);
        const data = response.data;

        setRatioName(data.ratio_name);
        const formattedRatioData = data.market_ratio.map(item => ({
          date: new Date(item[0]).toISOString().split('T')[0],
          value: item[1],
        }));
        setRatioData(formattedRatioData);
      } catch (error) {
        console.error('Error fetching market ratio data:', error);
      }
    };

    fetchMarketRatioData();
  }, [id]);

  const values = ratioData.map(item => item.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);

  // Calculate the maximum value and step size
  const yAxisPadding = 0.1; // 10% padding to the max value
  const maxYAxisValue = Math.max(0, Math.ceil(maxValue * (1 + yAxisPadding)));
  const stepSize = isMobile 
    ? Math.ceil(maxYAxisValue / 6) // For mobile, divide into 6 steps
    : Math.ceil(maxYAxisValue / 5); // For desktop, divide into 5 steps

  const chartData = {
    labels: ratioData.map(item => item.date),
    datasets: [{
      label: `Market Ratio History for ${ratioName}`,
      data: values,
      borderColor: 'rgb(0, 255, 179)', // Line color
      backgroundColor: 'rgb(0, 255, 179)', // Fill color under the line
      borderWidth: 1,   // Thinner line
      pointRadius: 0.5,   // Smaller points
      fill: false,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allow the chart to adjust to container size
    scales: {
      x: {
        ticks: {
          color: 'rgb(0, 255, 179)', // X-axis tick color
        },
        grid: {
          color: 'rgb(68, 68, 68)', // X-axis grid line color
        },
        title: {
          display: true,
          text: 'Date',
          color: 'rgb(0, 255, 179)', // X-axis title color
        }
      },
      y: {
        ticks: {
          color: 'rgb(0, 255, 179)', // Y-axis tick color
          stepSize: stepSize,
        },
        grid: {
          color: 'rgb(68, 68, 68)', // Y-axis grid line color
        },
        title: {
          display: true,
          text: 'Value',
          color: 'rgb(0, 255, 179)', // Y-axis title color
        },
        min: Math.min(0, minValue), // Ensure the Y-axis starts at 0 or the minimum value if it's negative
        max: maxYAxisValue, // Set the maximum value dynamically
      }
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgb(0, 255, 179)', // Legend label color
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
      }
    }
  };

  return (
    <div className='mr-container'>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
};

export default MarketRatio;
