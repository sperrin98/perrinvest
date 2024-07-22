// components/EcoDataPoints.js
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './EcoDataPoints.css'

function EcoDataPoints() {
  const [ecoDataPoints, setEcoDataPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/eco-data-points')
      .then(response => response.json())
      .then(data => {
        console.log(data);  // Debugging: log data to console
        setEcoDataPoints(data);
        setLoading(false);
      })
      .catch(error => {
        console.error(error);  // Debugging: log error to console
        setError(error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Eco Data Points</h1>
      <ul>
        {ecoDataPoints.map(point => (
          <li key={point.eco_data_point_id}>
            <Link to={`/eco-data-points/${point.eco_data_point_id}`}>
              {point.eco_data_point_name} ({point.period})
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EcoDataPoints;
