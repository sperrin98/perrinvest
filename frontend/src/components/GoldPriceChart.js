import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, Title, Tooltip, Legend } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import axios from 'axios';
import { Chart } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, TimeScale, Title, Tooltip, Legend, CandlestickController, CandlestickElement);

const GoldPriceChart = () => {
  const [chartData, setChartData] = useState({ datasets: [] });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/gold-price-history`)
      .then(response => {
        const data = response.data;

        // Filter out entries with missing data
        const filteredData = data.filter(entry =>
          entry.Date && entry.Open != null && entry.High != null && entry.Low != null && entry.Close != null
        );

        // Format the data for the chart
        const formattedData = filteredData.map(entry => ({
          x: new Date(entry.Date),
          o: entry.Open,
          h: entry.High,
          l: entry.Low,
          c: entry.Close,
        }));

        setChartData({
          datasets: [
            {
              label: 'Gold Price',
              data: formattedData,
              borderColor: 'rgba(255, 206, 86, 1)',
              backgroundColor: 'rgba(255, 206, 86, 0.2)',
              barThickness: 1,
              barPercentage: 0.1, // Adjust this value to change candlestick width
              categoryPercentage: 0.1, // Ensure spacing is uniform
            },
          ],
        });
      })
      .catch(error => {
        console.error('Error fetching gold price history:', error);
      });

    // Handle window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ width: '50%', height: '50%'}}>
      <h2 className='carousel-header'>Gold Price History</h2>
      <Chart
        type='candlestick'
        data={chartData}
        options={{
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  const o = context.raw.o.toFixed(2);
                  const h = context.raw.h.toFixed(2);
                  const l = context.raw.l.toFixed(2);
                  const c = context.raw.c.toFixed(2);
                  return `Open: ${o}, High: ${h}, Low: ${l}, Close: ${c}`;
                },
              },
            },
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'day',
                tooltipFormat: 'MMM d, yyyy',
              },
              title: {
                display: true,
                text: 'Date',
                color: 'rgb(0, 255, 179)',
              },
              grid: {
                color: 'rgb(68, 68, 68)', // Custom color for x-axis grid lines
              },
              ticks: {
                color: 'rgb(0, 255, 179)', // Custom color for x-axis labels
              },
            },
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: 'Price',
                color: 'rgb(0, 255, 179)',
              },
              grid: {
                color: 'rgb(68, 68, 68)', // Custom color for y-axis grid lines
              },
              ticks: {
                color: 'rgb(0, 255, 179)', // Custom color for y-axis labels
              },
              // Adjust Y-axis range for mobile
              ...(isMobile ? {
                min: 0, // Adjust as needed for mobile
                max: 2000, // Adjust as needed for mobile
              } : {}),
            },
          },
        }}
      />
    </div>
  );
};

export default GoldPriceChart;
