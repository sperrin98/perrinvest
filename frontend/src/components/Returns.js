import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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
        setSecurities(result);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurities();
  }, []);

  return (
    <div>
      <h1>Annual Returns in Major Currencies</h1>
      <ul>
        <li><Link to="/returns/1">Gold Price Returns</Link></li>
        <li><Link to="/returns/2">Silver Price Returns</Link></li>
      </ul>

      <h2>Stock Markets Priced in Gold</h2>
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
