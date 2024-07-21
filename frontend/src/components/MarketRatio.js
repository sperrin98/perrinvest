import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const MarketRatio = () => {
  const { id } = useParams();
  const [ratioData, setRatioData] = useState([]);
  const [ratioName, setRatioName] = useState('');

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

  const chartData = {
    labels: ratioData.map(item => item.date),
    datasets: [{
      label: `Market Ratio History for ${ratioName}`,
      data: ratioData.map(item => item.value),
      borderColor: 'rgb(0, 255, 179)', // Line color
      backgroundColor: 'rgb(0, 255, 179)', // Fill color under the line
      fill: false,
    }],
  };

  const chartOptions = {
    responsive: true,
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
        },
        grid: {
          color: 'rgb(68, 68, 68)', // Y-axis grid line color
        },
        title: {
          display: true,
          text: 'Value',
          color: 'rgb(0, 255, 179)', // Y-axis title color
        }
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
