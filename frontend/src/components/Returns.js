import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Returns.css'

const Returns = () => {
  const [securities, setSecurities] = useState([]); // State to hold fetched securities
  const [loading, setLoading] = useState(true); // State to handle loading state
  const [error, setError] = useState(null); // State to handle errors

  // Fetch stock markets priced in gold
  useEffect(() => {
    const fetchSecurities = async () => {
      try {
        const response = await fetch('http://localhost:5000/securities/asset-class-2');
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const result = await response.json();
        setSecurities(result); // Set the fetched securities to state
      } catch (error) {
        setError(error.message); // Set the error message to state
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchSecurities(); // Call the fetch function
  }, []); // Empty dependency array ensures it only runs once

  return (
    <div className='returns-container'>
      <h1>Returns of Major Currencies priced in Gold</h1>
      <ul>
        <li><Link to="/returns/1">Gold Price Returns</Link></li>
        <li><Link to="/returns/2">Silver Price Returns</Link></li>
      </ul>

      <h1>Stock Markets Priced in Gold</h1>
      {loading && <div>Loading stock markets...</div>}
      {error && <div>{`Error: ${error}`}</div>}
      <ul>
        {securities.length > 0 ? (
          securities.map((security) => (
            <li key={security.security_id}>
              <Link to={`/stockmarketreturn/${security.security_id}`}>
                {security.security_long_name}
              </Link>
            </li>
          ))
        ) : (
          <li>No stock markets available.</li>
        )}
      </ul>
    </div>
  );
};

export default Returns;
