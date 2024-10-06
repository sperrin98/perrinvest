import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './Security.css';  // Ensure this path is correct
import useIsMobile from './useIsMobile';  // Ensure this path is correct

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Security = () => {
  const { id } = useParams(); // Get the security ID from URL
  const [security, setSecurity] = useState(null);
  const [priceHistories, setPriceHistories] = useState([]);
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
        const response = await axios.get(`http://localhost:5000/securities/${id}/price-histories`);
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
  }, [id]);

  // Handle loading state
  if (!security) {
    return <div>Loading...</div>;
  }

  // Access the security long name from the security array
  const securityLongName = security[1]; // Assuming security_long_name is the second item in the array

  const prices = priceHistories.map(history => history.price);

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
        }
      },
      y: {
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
        }
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
          label: function(context) {
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
      <div className='chart-wrapper'>
        <Line data={data} options={chartOptions} />
      </div>
    </div>
  );
};

export default Security;
