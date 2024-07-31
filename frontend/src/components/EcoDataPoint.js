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
  const [ecoDataPointName, setEcoDataPointName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('Fetching data for ID:', id);

    // Fetch histories
    fetch(`http://localhost:5000/eco-data-points/${id}/histories`)
      .then(response => {
        console.log('Response Status:', response.status);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(histories => {
        console.log('Fetched Histories:', histories);
        setData(histories);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching histories:', error);
        setError(error);
        setLoading(false);
      });

    // Fetch eco data point name
    fetch(`http://localhost:5000/eco-data-points/${id}`)
      .then(response => {
        console.log('Response Status:', response.status);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(dataPoint => {
        console.log('Fetched Data Point:', dataPoint);
        setEcoDataPointName(dataPoint.eco_data_point_name);
      })
      .catch(error => {
        console.error('Error fetching data point name:', error);
        setError(error);
      });

  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // Prepare data for Chart.js
  const chartData = {
    labels: data.map(point => formatDate(point.price_date)), // Dates on the x-axis
    datasets: [
      {
        label: `${ecoDataPointName}`,
        data: data.map(point => point.price), // Prices on the y-axis
        fill: false,
        borderColor: 'rgb(0, 255, 179)',
        backgroundColor: 'rgb(0, 255, 179)',
        tension: 0.1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: 'rgb(0, 255, 179)' 
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 255, 179, 0.8)'
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'rgb(0, 255, 179)', 
        },
        grid: {
          color: 'rgb(68, 68, 68)', 
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: 'rgb(0, 255, 179)', 
        },
        grid: {
          color: 'rgb(68, 68, 68)',
        },
        title: {
          display: true,
          text: 'Value',
          color: 'rgb(0, 255, 179)',
        }
      }
    }
  };

  return (
    <div className='edph-container'>
      {/* <h1 className='edp-header'>{ecoDataPointName}</h1> */}
      <div className='chart-wrapper'>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

export default EcoDataPoint;
