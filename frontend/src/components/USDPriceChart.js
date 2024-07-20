import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, Title, Tooltip, Legend } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import { Chart } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, TimeScale, Title, Tooltip, Legend, CandlestickController, CandlestickElement);

const USDPriceChart = () => {
  const [chartData, setChartData] = useState({ datasets: [] });

  useEffect(() => {
    fetch('http://localhost:5000/api/usd-price-history')
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
              label: 'USD Price',
              data: formattedData,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              barThickness: 1, // Adjust this value to control candlestick width
              categoryPercentage: 1.0, // Ensure spacing is uniform
              barPercentage: 1.0, // Ensures bars fill available space
            },
          ],
        });
      })
      .catch(error => {
        console.error('Error fetching USD price history:', error);
      });
  }, []);

  return (
    <div style={{ width: '50%', height: '50%'}}>
    <h2 className='carousel-header'>US Dollar Price History</h2>
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
              },
              grid: {
                display: false,
              },
            },
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: 'Price',
              },
            },
          },
        }}
      />
    </div>
  );
};

export default USDPriceChart;
