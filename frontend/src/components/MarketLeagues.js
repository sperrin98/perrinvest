import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MarketLeagues = () => {
  const [marketLeagues, setMarketLeagues] = useState([]);

  useEffect(() => {
    const fetchMarketLeagues = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL; // Fetch API base URL from environment variable
        const response = await axios.get(`${apiUrl}/market_leagues`);
        console.log('Fetched market leagues:', response.data);
        setMarketLeagues(response.data);
      } catch (error) {
        console.error('Error fetching market leagues:', error);
      }
    };

    fetchMarketLeagues();
  }, []);

  return (
    <div>
      <h1>Market Leagues</h1>
      <ul>
        {marketLeagues.length > 0 ? (
          marketLeagues.map((league) => (
            <li key={league[0]}>{league[1]} </li>
          ))
        ) : (
          <p>No market leagues available.</p>
        )}
      </ul>
    </div>
  );
};

export default MarketLeagues;
