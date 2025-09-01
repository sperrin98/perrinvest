import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import Chart from 'chart.js/auto';
import './EcoDataPoints.css';

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

function EcoDataPoint({ id }) {
  const [data, setData] = useState([]);
  const [ecoDataPointName, setEcoDataPointName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    fetch(`${process.env.REACT_APP_API_URL}/eco-data-points/${id}/histories`)
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(histories => {
        setData(histories);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });

    fetch(`${process.env.REACT_APP_API_URL}/eco-data-points/${id}`)
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(dataPoint => {
        setEcoDataPointName(dataPoint.eco_data_point_name);
      })
      .catch(err => {
        setError(err);
      });
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const chartData = {
    labels: data.map(point => formatDate(point.price_date)),
    datasets: [
      {
        label: ecoDataPointName,
        data: data.map(point => point.price),
        fill: false,
        borderColor: '#00796b',
        backgroundColor: '#00796b',
        borderWidth: 2,
        pointRadius: 1,
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, labels: { color: '#00796b' } },
      tooltip: { backgroundColor: '#00796b' },
    },
    scales: {
      x: { ticks: { color: '#00796b' }, grid: { color: 'rgb(68, 68, 68)' } },
      y: {
        beginAtZero: true,
        ticks: { color: '#00796b' },
        grid: { color: 'rgb(68, 68, 68)' },
        title: { display: true, text: 'Value', color: 'rgb(0, 255, 179)' },
      },
    },
  };

  return (
    <div className='edph-container'>
      <div className='chart-wrapper'>
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

export default EcoDataPoint;
