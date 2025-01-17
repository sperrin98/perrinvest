import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './MarketLeagues.css';

const MarketLeagues = () => {
  const [marketLeagues, setMarketLeagues] = useState([]);
  const [leagueTable, setLeagueTable] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [selectedLeagueName, setSelectedLeagueName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [errorMessage, setErrorMessage] = useState('');
  const [constituentData, setConstituentData] = useState([]);

  // Fetch market leagues when the component mounts
  useEffect(() => {
    const fetchMarketLeagues = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        const response = await axios.get(`${apiUrl}/market_leagues`);
        setMarketLeagues(response.data);
      } catch (error) {
        console.error('Error fetching market leagues:', error);
        setErrorMessage('Error fetching market leagues');
      }
    };

    fetchMarketLeagues();
  }, []);

  // Fetch league table data for selected league and date
  const fetchLeagueTable = async (leagueId, leagueName, date) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const formattedDate = date.toISOString().split('T')[0];
      const response = await axios.get(`${apiUrl}/market_league_table/${leagueId}/${formattedDate}`);
      setLeagueTable(response.data);
      setSelectedLeagueId(leagueId);
      setSelectedLeagueName(leagueName);
      setConstituentData([]); // Clear previous constituent data
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching league table:', error);
      setErrorMessage('Error fetching league data');
    }
  };

  // Fetch constituent data when a row is clicked
  const fetchConstituentData = async (constituentId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await axios.get(`${apiUrl}/get_market_league_data/${constituentId}`);
      if (response.data.error) {
        setErrorMessage(response.data.error);
        setConstituentData([]);
      } else {
        setConstituentData(response.data);
        setErrorMessage('');
      }
    } catch (error) {
      console.error('Error fetching constituent data:', error);
      setErrorMessage('Error fetching constituent data');
    }
  };

  // Handle date change from the date picker
  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (selectedLeagueId) {
      fetchLeagueTable(selectedLeagueId, selectedLeagueName, date);
    }
  };

  return (
    <div className="market-league-container">
      <div className="market-league-list-container">
        <h1>Market Leagues</h1>
        <ul className="market-league-list">
          {marketLeagues.length > 0 ? (
            marketLeagues.map((league) => (
              <li
                key={league[0]}
                className="market-league-item"
                onClick={() => fetchLeagueTable(league[0], league[1], selectedDate)}
              >
                {league[1]}
              </li>
            ))
          ) : (
            <p>No market leagues available.</p>
          )}
        </ul>

        {/* Date picker */}
        <div className="date-picker-container">
          <label htmlFor="date-picker">Select Date: </label>
          <DatePicker
            id="date-picker"
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="yyyy-MM-dd"
            className="date-picker-input"
          />
        </div>
      </div>

      {/* Display league table for selected league */}
      {selectedLeagueId && (
        <div className="league-table-container">
          <h2>League Table for {selectedLeagueName}</h2>
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
                  <tr
                    key={index}
                    onClick={() => fetchConstituentData(row[0])} // Fetch constituent data
                  >
                    <td>{row[1]}</td> {/* Security name */}
                    <td>{row[2]}</td> {/* Price */}
                    <td>{row[3]}</td> {/* Daily Move */}
                    <td>{row[4]}</td> {/* Score */}
                    <td>{row[5]}</td> {/* Relative Momentum */}
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5">{errorMessage || 'No data available'}</td></tr>
              )}
            </tbody>
          </table>

          {/* Display constituent data below the league table */}
          {constituentData.length > 0 && (
            <div className="constituent-data-container">
              <h3>Constituent Data</h3>
              <table className="constituent-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Relative Index</th>
                    <th>Short EMA</th>
                    <th>Long EMA</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {constituentData.map((row, index) => (
                    <tr key={index}>
                      <td>{row[0]}</td>
                      <td>{row[1]}</td>
                      <td>{row[2]}</td>
                      <td>{row[3]}</td>
                      <td>{row[4]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketLeagues;
