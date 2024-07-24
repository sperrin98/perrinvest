import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Chart from 'chart.js/auto'; // Import Chart.js
import './Currencies.css';

function Currency() {
  const { id } = useParams();
  const [currency, setCurrency] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chart, setChart] = useState(null); // State to store the chart instance
  const [currencyName, setCurrencyName] = useState(''); // State to store currency name

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Adding leading zero
    const day = ('0' + date.getDate()).slice(-2); // Adding leading zero
    return `${year}/${month}/${day}`;
  };

  useEffect(() => {
    // Fetch currency data
    fetch(`http://localhost:5000/currencies/${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setCurrency(data.currency);
        setCurrencyName(data.currency?.security_long_name || ''); // Store currency name
        // Format dates in priceHistory
        const formattedPriceHistory = data.price_history.map(record => ({
          ...record,
          price_date: formatDate(record.price_date)
        }));
        setPriceHistory(formattedPriceHistory);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (priceHistory.length > 0) {
      const ctx = document.getElementById('priceChart');
      // Destroy the existing chart if it exists
      if (chart) {
        chart.destroy();
      }
      const newChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: priceHistory.map(record => record.price_date),
          datasets: [{
            label: currencyName, // Use the currency name here
            data: priceHistory.map(record => record.price),
            borderColor: 'rgb(0, 255, 179)', // Custom border color
            backgroundColor: 'rgba(0, 255, 179, 0.2)', // Custom background color
            borderWidth: 2, // Custom border width
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: true,
              labels: {
                color: 'rgb(0, 255, 179)', // Custom legend text color
              },
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Price: ${context.raw}`;
                },
              },
              titleColor: 'rgb(0, 255, 179)', // Custom tooltip title color
              bodyColor: 'rgb(0, 255, 179)', // Custom tooltip body color
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Date',
                color: 'rgb(0, 255, 179)', // Custom x-axis title color
              },
              ticks: {
                autoSkip: true,
                color: 'rgb(0, 255, 179)', // Custom x-axis tick color
              },
            },
            y: {
              title: {
                display: true,
                text: 'Price',
                color: 'rgb(0, 255, 179)', // Custom y-axis title color
              },
              ticks: {
                color: 'rgb(0, 255, 179)', // Custom y-axis tick color
              },
            },
          },
        },
      });
      setChart(newChart); // Save the new chart instance
    }
  }, [priceHistory, currencyName, chart]); // Depend on currencyName to update chart label

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="currency-container">
      <canvas id="priceChart"></canvas>
    </div>
  );
}

export default Currency;
