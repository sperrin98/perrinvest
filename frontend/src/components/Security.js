import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './Security.css';  // Ensure this path is correct
import useIsMobile from './useIsMobile';  // Ensure this path is correct

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Security = () => {
  const { id } = useParams();
  const [security, setSecurity] = useState(null);
  const [priceHistories, setPriceHistories] = useState([]);
  const isMobile = useIsMobile(); // Use the custom hook

  useEffect(() => {
    const fetchSecurity = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/securities/${id}`);
        setSecurity(response.data.security);
      } catch (error) {
        console.error('Error fetching security:', error);
      }
    };

    const fetchPriceHistories = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/securities/${id}/price-histories`);
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

  const prices = priceHistories.map(history => history.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);

  // Calculate the maximum value and step size
  const yAxisPadding = 0.1; // 10% padding to the max price
  const maxYAxisValue = Math.max(0, Math.ceil(maxPrice * (1 + yAxisPadding)));
  const stepSize = isMobile 
    ? Math.ceil(maxYAxisValue / 6) // For mobile, divide into 6 steps
    : Math.ceil(maxYAxisValue / 5); // For desktop, divide into 5 steps

    const data = {
      labels: priceHistories.map(history => history.date),
      datasets: [{
        label: `Price History for ${security.security_long_name}`,
        data: prices,
        borderColor: 'rgb(0, 255, 179)',
        backgroundColor: 'rgb(0, 255, 179)',
        fill: false,
        borderWidth: 1,   // Thinner line
        pointRadius: 0.5,   // Smaller points
        pointHoverRadius: 4, // Adjust hover size if needed
      }],
    };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allow the chart to adjust to container size
    scales: {
      x: {
        ticks: {
          color: 'rgb(0, 255, 179)',
        },
        grid: {
          color: 'rgb(68, 68, 68)',
        },
        title: {
          display: true,
          text: 'Date',
          color: 'rgb(0, 255, 179)',
        }
      },
      y: {
        ticks: {
          color: 'rgb(0, 255, 179)',
          stepSize: stepSize,
        },
        grid: {
          color: 'rgb(68, 68, 68)',
        },
        title: {
          display: true,
          text: 'Value',
          color: 'rgb(0, 255, 179)'
        },
        min: 0, // Ensure the Y-axis starts at 0
        max: maxYAxisValue, // Set the maximum value dynamically
      }
    },
    plugins: {
      legend: {
        labels: {
          color: 'rgb(0, 255, 179)'
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
    <div className='security-container'>
      <div className='chart-wrapper'>
        <Line data={data} options={chartOptions} />
      </div>
    </div>
  );
};

export default Security;
