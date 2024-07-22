// src/EcoDataPointsPage.js
import React, { useEffect, useState } from 'react';

function EcoDataPointsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/eco-data-points')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className='edp-container'>
      <h1>Eco Data Points</h1>
      <ul>
        {data.map(item => (
          <li key={item.eco_data_point_id}>
            <strong>{item.eco_data_point_name}</strong>: {item.period}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EcoDataPointsPage;
