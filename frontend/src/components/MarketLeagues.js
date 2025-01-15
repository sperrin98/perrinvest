import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MarketLeagues = () => {
  const [marketLeagues, setMarketLeagues] = useState([]);
  const [leagueTable, setLeagueTable] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);

  // Calculate the previous trading day (excluding weekends)
  const getPreviousTradingDay = () => {
    const today = new Date();
    let previousDay = new Date(today.setDate(today.getDate() - 1));

    // Adjust for weekends
    if (previousDay.getDay() === 0) {
      previousDay.setDate(previousDay.getDate() - 2); // Sunday -> Friday
    } else if (previousDay.getDay() === 6) {
      previousDay.setDate(previousDay.getDate() - 1); // Saturday -> Friday
    }

    return previousDay.toISOString().split('T')[0];
  };

  useEffect(() => {
    // Fetch market leagues when the component mounts
    const fetchMarketLeagues = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        const response = await axios.get(`${apiUrl}/market_leagues`);
        console.log('Fetched market leagues:', response.data);
        setMarketLeagues(response.data);
      } catch (error) {
        console.error('Error fetching market leagues:', error);
      }
    };

    fetchMarketLeagues();
  }, []);

  // Fetch league table when a league is clicked
  const fetchLeagueTable = async (leagueId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const date = getPreviousTradingDay(); // Fetch previous trading day dynamically
      console.log(`Fetching league table for league ID: ${leagueId} on date: ${date}`);
      const response = await axios.get(`${apiUrl}/market_league_table/${leagueId}/${date}`);
      console.log('Fetched league table:', response.data);
      setLeagueTable(response.data);
      setSelectedLeagueId(leagueId);
    } catch (error) {
      console.error('Error fetching league table:', error);
    }
  };

  return (
    <div>
      <h1>Market Leagues</h1>
      <ul>
        {marketLeagues.length > 0 ? (
          marketLeagues.map((league) => (
            <li key={league[0]} onClick={() => fetchLeagueTable(league[0])}>
              {league[1]}
            </li>
          ))
        ) : (
          <p>No market leagues available.</p>
        )}
      </ul>

      {/* Display league table for selected league */}
      {selectedLeagueId && (
        <div>
          <h2>League Table for League ID: {selectedLeagueId}</h2>
          <ul>
            {leagueTable.length > 0 ? (
              leagueTable.map((row, index) => (
                <li key={index}>{JSON.stringify(row)}</li>
              ))
            ) : (
              <p>No league data available.</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MarketLeagues;
