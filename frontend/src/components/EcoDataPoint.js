import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './EcoDataPoints.css';

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

  return (
    <div className='edph-container'>
      <h1>Eco Data Point Histories</h1>
      <ul>
        {data.length > 0 ? (
          data.map((point, index) => (
            <li key={index}>
              {formatDate(point[0])}: {point[1]}  {/* Ensure point[0] is a date string and point[1] is the price */}
            </li>
          ))
        ) : (
          <li>No data available</li>
        )}
      </ul>
    </div>
  );
}

export default EcoDataPoint;
