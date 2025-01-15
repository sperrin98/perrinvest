import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './MarketLeagues.css'; // Importing the CSS file

const MarketLeagues = () => {
  const [marketLeagues, setMarketLeagues] = useState([]);
  const [leagueTable, setLeagueTable] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);

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
      const date = "2025-01-13";  // Set the date for the league table
      const response = await axios.get(`${apiUrl}/market_league_table/${leagueId}/${date}`);
      console.log('Fetched league table:', response.data);
      setLeagueTable(response.data);
      setSelectedLeagueId(leagueId);
    } catch (error) {
      console.error('Error fetching league table:', error);
    }
  };

  return (
    <div className="market-league-container">
      {/* Market Leagues List on the Left */}
      <div className="market-league-list-container">
        <h1>Market Leagues</h1>
        <ul className="market-league-list">
          {marketLeagues.length > 0 ? (
            marketLeagues.map((league) => (
              <li
                key={league[0]}
                onClick={() => fetchLeagueTable(league[0])}
                className="market-league-item"
              >
                {league[1]}
              </li>
            ))
          ) : (
            <p>No market leagues available.</p>
          )}
        </ul>
      </div>

      {/* League Table on the Right */}
      <div className="league-table-container">
        {selectedLeagueId && (
          <div>
            <h2>League Table for League ID: {selectedLeagueId}</h2>
            <table className="league-table">
              <thead>
                <tr>
                  <th>Security</th>
                  <th>Price</th>
                  <th>Daily Move</th>
                  <th>Score</th>
                  <th>Relative Momentum</th>
                </tr>
              </thead>
              <tbody>
                {leagueTable.length > 0 ? (
                  leagueTable.map((row, index) => (
                    <tr key={index}>
                      <td>{row[0]}</td> {/* Security */}
                      <td>{row[1]}</td> {/* Price */}
                      <td>{row[2]}</td> {/* Daily Move */}
                      <td>{row[3]}</td> {/* Score */}
                      <td>{row[4]}</td> {/* Relative Momentum */}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketLeagues;
