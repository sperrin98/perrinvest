import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2'; // Import the chart component from react-chartjs-2
import Chart from 'chart.js/auto'; // Auto import to register all required components
import './EcoDataPoints.css';

// Function to format date as YYYY/MM/DD
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}/${month}/${day}`;
}

function EcoDataPoint() {
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Fetching data for ID:', id);

    fetch(`http://localhost:5000/eco-data-points/${id}/histories`)
      .then(response => {
        console.log('Response Status:', response.status);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        console.log('Fetched Data:', data); // Verify data structure
        setData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setError(error);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // Prepare data for Chart.js
  const chartData = {
    labels: data.map(point => formatDate(point[0])), // Dates on the x-axis
    datasets: [
      {
        label: 'Price',
        data: data.map(point => point[1]), // Prices on the y-axis
        fill: false,
        borderColor: 'rgba(75,192,192,1)',
        tension: 0.1
      }
    ]
  };

  return (
    <div className='edph-container'>
      <h1>Eco Data Point Histories</h1>
      <div className='chart-container'>
        <Line data={chartData} />
      </div>
    </div>
  );
}

export default EcoDataPoint;
