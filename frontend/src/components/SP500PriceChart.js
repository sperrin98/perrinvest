import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, Title, Tooltip, Legend } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import { Chart } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, TimeScale, Title, Tooltip, Legend, CandlestickController, CandlestickElement);

const SP500PriceChart = () => {
  const [chartData, setChartData] = useState({ datasets: [] });

  useEffect(() => {
    fetch('http://localhost:5000/api/sp500-price-history')
      .then(response => response.json())
      .then(data => {
        // Format the data for the chart
        const formattedData = data.map(entry => ({
          x: new Date(entry.Date),
          o: entry.Open,
          h: entry.High,
          l: entry.Low,
          c: entry.Close,
        }));

        setChartData({
          datasets: [
            {
              label: 'S&P 500 Price',
              data: formattedData,
              borderColor: 'rgba(153, 102, 255, 1)',
              backgroundColor: 'rgba(153, 102, 255, 0.2)',
              barThickness: 1, // Adjust this value to control candlestick width
              categoryPercentage: 1.0, // Ensure spacing is uniform
              barPercentage: 1.0, // Ensures bars fill available space
            },
          ],
        });
      })
      .catch(error => {
        console.error('Error fetching S&P 500 price history:', error);
      });
  }, []);

  return (
    <div style={{ width: '50%', height: '50%'}}>
    <h2 className='carousel-header'>S&P500 Price History</h2>
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
            },
          },
        }}
      />
    </div>
  );
};

export default SP500PriceChart;
