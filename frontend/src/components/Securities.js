import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Securities.css';

function Securities() {
  const [securities, setSecurities] = useState([]);
  const [assetClasses, setAssetClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSecurities, setFilteredSecurities] = useState([]);
  const [assetClassFilter, setAssetClassFilter] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchAssetClasses() {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/asset_classes`);
        setAssetClasses(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Error fetching asset classes:', err);
        setAssetClasses([]);
      }
    }

    fetchAssetClasses();
  }, []);

  useEffect(() => {
    async function fetchSecurities() {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/securities`);
        setSecurities(Array.isArray(response.data) ? response.data : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching securities:', err);
        setError('Failed to load securities.');
        setSecurities([]);
      }
    }

    fetchSecurities();
  }, []);

  useEffect(() => {
    setFilteredSecurities(
      securities.filter((security) => {
        const matchesSearch =
          (security.security_long_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (security.security_short_name || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesAssetClass = assetClassFilter
          ? security.asset_class_id === parseInt(assetClassFilter, 10)
          : true;

        return matchesSearch && matchesAssetClass;
      })
    );
  }, [searchTerm, securities, assetClassFilter]);

  const handleRowClick = (security_id) => {
    if (security_id) {
      navigate(`/securities/${security_id}`);
    } else {
      console.error('Security ID is missing!');
    }
  };

  return (
    <div className="securities-container">
      <div className="search-filter-container">
        <div className="sec-search-container">
          <input
            type="text"
            placeholder="Search securities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sec-search-input"
          />
        </div>

        <div className="filter-container">
          <label htmlFor="asset-class-filter">Filter by Asset Class:</label>
          <select
            id="asset-class-filter"
            value={assetClassFilter}
            onChange={(e) => setAssetClassFilter(e.target.value)}
          >
            <option value="">All</option>
            {assetClasses.map((assetClass) => (
              <option key={assetClass.asset_class_id} value={assetClass.asset_class_id}>
                {assetClass.asset_class_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="securities-table-shell">
        <table className="securities-table">
          <thead>
            <tr>
              <th className="long-name-header">Security Long Name</th>
              <th>Security Short Name</th>
              <th>Latest Price</th>
              <th>% Change</th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr>
                <td colSpan="4">{error}</td>
              </tr>
            )}

            {!error && filteredSecurities.length > 0 ? (
              filteredSecurities.map((security) => (
                <tr
                  key={security.security_id}
                  onClick={() => handleRowClick(security.security_id)}
                  className="clickable-row"
                >
                  <td className="security-long-name">{security.security_long_name}</td>
                  <td className="security-short-name">{security.security_short_name}</td>
                  <td className="latest-price">
                    {security.latest_price
                      ? `$${security.latest_price.toFixed(2)}`
                      : 'No Price Available'}
                  </td>
                  <td
                    className={
                      security.percent_change >= 0
                        ? 'positive-change'
                        : 'negative-change'
                    }
                  >
                    {security.percent_change !== null &&
                    security.percent_change !== undefined
                      ? `${security.percent_change.toFixed(2)}%`
                      : 'No Change Available'}
                  </td>
                </tr>
              ))
            ) : (
              !error && (
                <tr>
                  <td colSpan="4">No securities found</td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <div className="back-button-container">
        <button onClick={() => navigate('/')} className="back-button">
          Go Back to Homepage
        </button>
      </div>
    </div>
  );
}

export default Securities;