import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Returns.css';

const Returns = () => {
  const [securities, setSecurities] = useState([]); // For storing fetched securities
  const [error, setError] = useState(null); // For error handling
  const [selectedOption, setSelectedOption] = useState(''); // For storing selected dropdown option

  // Fetch data based on selected option (Stock Markets or Currencies)
  useEffect(() => {
    if (!selectedOption) return; // Do nothing if no option is selected

    const fetchSecurities = async () => {
      // Fetching data based on dropdown selection
      if (selectedOption === 'stock-markets') {
        const url = `${process.env.REACT_APP_API_URL}/securities/asset-class-2`; // Stock markets URL
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
          }
          const result = await response.json();
          setSecurities(result); // Store stock markets data in state
        } catch (error) {
          setError(error.message); // Handle errors
        }
      }
    };

    fetchSecurities(); // Fetch data when option changes
  }, [selectedOption]);

  return (
    <div className="returns-container">
      <h1>Returns of Major Assets</h1>

      {/* Dropdown for selecting either Currencies, Stock Markets or Annual Returns */}
      <div className="dropdown-container">
        <label htmlFor="securities-select" className="dropdown-label">Select Option:</label>
        <select
          id="securities-select"
          value={selectedOption}
          onChange={(e) => setSelectedOption(e.target.value)} // Update selected option
        >
          <option value="">Select...</option>
          <option value="currencies">Currencies Priced in Gold/Silver</option>
          <option value="stock-markets">Stock Markets Priced in Gold</option>
          <option value="annual-returns">Annual Returns</option> {/* New option */}
        </select>
      </div>

      {/* Show Currencies-related links when "Currencies" is selected */}
      {selectedOption === 'currencies' && (
        <div className="currencies-links">
          <ul>
            <li><Link to="/returns/1">Gold Price Returns</Link></li>
            <li><Link to="/returns/2">Silver Price Returns</Link></li>
          </ul>
        </div>
      )}

      {/* Show error message if data fetch fails */}
      {error && <div>{`Error: ${error}`}</div>}

      {/* Show the list of Stock Markets when "Stock Markets" is selected */}
      {selectedOption === 'stock-markets' && (
        <div className="securities-list">
          {securities.length > 0 ? (
            <ul>
              {securities.map((security) => (
                <li key={security.security_id}>
                  <Link to={`/stockmarketreturn/${security.security_id}`}>
                    {security.security_long_name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div>No stock markets available.</div>
          )}
        </div>
      )}

      {/* Show link for Annual Returns */}
      {selectedOption === 'annual-returns' && (
        <div className="annual-returns-link">
          <Link to="/annualreturns">Go to Annual Returns</Link>
        </div>
      )}
    </div>
  );
};

export default Returns;
