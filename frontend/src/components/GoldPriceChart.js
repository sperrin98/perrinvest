// GoldPriceChart.js
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const GoldPriceChart = () => {
  const [chartData, setChartData] = useState({ datasets: [] });

  useEffect(() => {
    axios.get('http://localhost:5000/api/gold-price-history')
      .then(response => {
        const data = response.data;
        const dates = data.map(entry => entry.Date.split('T')[0]);
        const prices = data.map(entry => entry.Close);

        setChartData({
          labels: dates,
          datasets: [
            {
              label: 'Gold Price',
              data: prices,
              borderColor: 'rgba(255, 206, 86, 1)',
              backgroundColor: 'rgba(255, 206, 86, 0.2)',
              borderWidth: 1,
            },
          ],
        });
      })
      .catch(error => {
        console.error('Error fetching gold price history:', error);
      });
  }, []);

  return (
    <div>
      <h2>Gold Price History</h2>
      <Line data={chartData} />
    </div>
  );
};

export default GoldPriceChart;
