import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './EcoDataPoints.css';

function EcoDataPoints() {
  const [ecoDataPoints, setEcoDataPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/eco-data-points`)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        setEcoDataPoints(data);
        setLoading(false);
      })
      .catch(error => {
        console.error(error);
        setError(error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const filteredDataPoints = ecoDataPoints.filter(point =>
    point.eco_data_point_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='edp-container'>
      <div className='search-container'>
        <input
          type='text'
          placeholder='Search Eco Data Points...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='search-input'
        />
      </div>

      <table className='ecodatapoints-table'>
        <thead>
          <tr>
            <th className='id-header'></th>
            <th className='first-header'>Name</th>
            <th>Period</th>
          </tr>
        </thead>
        <tbody>
          {filteredDataPoints.map(point => (
            <tr key={point.eco_data_point_id}>
              <td>{point.eco_data_point_id}</td>
              <td>
                <Link to={`/eco-data-points/${point.eco_data_point_id}`}>
                  {point.eco_data_point_name}
                </Link>
              </td>
              <td>{point.period}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="back-button-container">
        <Link to="/" className="back-button">Go Back to Homepage</Link>
      </div>
    </div>
  );
}

export default EcoDataPoints;