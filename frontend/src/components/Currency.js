import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './Currencies.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, LineElement, Title, Tooltip, Legend);

function Currency() {
  const { id } = useParams();
  const [currency, setCurrency] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}/${month}/${day}`;
  };

  useEffect(() => {
    fetch(`http://localhost:5000/currencies/${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setCurrency(data.currency);
        const formattedPriceHistory = data.price_history.map(record => ({
          ...record,
          price_date: formatDate(record.price_date),
        }));
        setPriceHistory(formattedPriceHistory);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const data = {
    labels: priceHistory.map(record => record.price_date),
    datasets: [{
      label: currency?.security_long_name || 'Price',
      data: priceHistory.map(record => record.price),
      borderColor: 'rgb(0, 255, 179)',
      backgroundColor: 'rgba(0, 255, 179, 0.2)',
      borderWidth: 1,   // Thinner line
      pointRadius: 0.5,   // Smaller points
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
    <div className="currency-container">
      <div className="chart-wrapper">
        <Line data={data} options={chartOptions} />
      </div>
    </div>
  );
}

export default Currency;
