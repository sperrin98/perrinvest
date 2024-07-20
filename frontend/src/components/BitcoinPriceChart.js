import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, TimeScale, Title, Tooltip, Legend } from 'chart.js';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import { Chart } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, TimeScale, Title, Tooltip, Legend, CandlestickController, CandlestickElement);

const BitcoinPriceChart = () => {
  const [chartData, setChartData] = useState({ datasets: [] });

  useEffect(() => {
    // Fetch data from local CSV file or endpoint
    fetch('http://localhost:5000/api/bitcoin-price-history')  // Adjust the URL as needed
      .then(response => response.json())
      .then(data => {
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
              label: 'Bitcoin Price',
              data: formattedData,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              barThickness: 1,
              categoryPercentage: 1.0,
              barPercentage: 1.0,
            },
          ],
        });
      })
      .catch(error => {
        console.error('Error fetching Bitcoin price history:', error);
      });
  }, []);

  return (
    <div style={{ width: '75%', height: '75%'}}>
      <h2>Bitcoin Price History</h2>
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
                displayFormats: {
                  day: 'MMM D',
                },
              },
              title: {
                display: true,
                text: 'Date',
              },
              ticks: {
                source: 'data',
                autoSkip: true,
                maxTicksLimit: 10,
              },
              grid: {
                display: false,
              },
            },
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: 'Price (USD)',
              },
            },
          },
        }}
      />
    </div>
  );
};

export default BitcoinPriceChart;
