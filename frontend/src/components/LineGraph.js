import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const LineGraph = () => {
  const [data, setData] = useState({});
  const [options, setOptions] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/gold-history');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        
        // Process data
        const labels = result.map(item => item.Date);
        const values = result.map(item => item.Close);

        setData({
          labels: labels,
          datasets: [
            {
              label: 'Gold Price History',
              data: values,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
            },
          ],
        });

        setOptions({
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            tooltip: {
              callbacks: {
                label: (tooltipItem) => `Price: $${tooltipItem.raw}`,
              },
            },
          },
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return <Line data={data} options={options} />;
};

export default LineGraph;
