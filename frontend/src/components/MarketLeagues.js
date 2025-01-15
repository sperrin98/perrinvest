import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Import the datepicker styles
import './MarketLeagues.css'; // Ensure this is imported

const MarketLeagues = () => {
  const [marketLeagues, setMarketLeagues] = useState([]);
  const [leagueTable, setLeagueTable] = useState([]);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [selectedLeagueName, setSelectedLeagueName] = useState(''); // Track the name of the selected league
  const [selectedDate, setSelectedDate] = useState(new Date()); // Track the selected date
  const [errorMessage, setErrorMessage] = useState(''); // Store error messages

  // Sample list of holidays (this can be extended based on actual holidays)
  const holidays = [
    '2025-01-01', // New Year's Day
    '2025-12-25', // Christmas Day
    // Add other holiday dates as needed
  ];

  // Fetch market leagues when the component mounts
  useEffect(() => {
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
  const fetchLeagueTable = async (leagueId, leagueName, date) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const formattedDate = date.toISOString().split('T')[0]; // Format date to 'YYYY-MM-DD'
      const response = await axios.get(`${apiUrl}/market_league_table/${leagueId}/${formattedDate}`);
      console.log('Fetched league table:', response.data);
      setLeagueTable(response.data);
      setSelectedLeagueId(leagueId);
      setSelectedLeagueName(leagueName); // Set the name of the selected league
      setErrorMessage(''); // Clear any error message if data exists
    } catch (error) {
      console.error('Error fetching league table:', error);
      setLeagueTable([]); // Clear any previous league data
      setErrorMessage('No data available for this date.'); // Set error message
    }
  };

  // Handle date change from the date picker
  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (selectedLeagueId) {
      fetchLeagueTable(selectedLeagueId, selectedLeagueName, date);
    }
  };

  // Custom function to disable weekends and holidays
  const filterDate = (date) => {
    const dayOfWeek = date.getDay();
    const formattedDate = date.toISOString().split('T')[0]; // 'YYYY-MM-DD'

    // Disable weekends (Saturday=6, Sunday=0) and holidays
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 is Sunday, 6 is Saturday
    const isHoliday = holidays.includes(formattedDate);

    return !(isWeekend || isHoliday); // Only enable weekdays
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
                {league[1]} {/* Display the name of the league */}
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
            filterDate={filterDate} // Apply filter function to disable weekends and holidays
          />
        </div>
      </div>

      {/* Error message or league table */}
      <div className="league-table-container">
        {selectedLeagueId && errorMessage && (
          <p className="error-message">{errorMessage}</p> // Error message if no data
        )}

        {selectedLeagueId && !errorMessage && (
          <>
            <h2>League Table for {selectedLeagueName}</h2> {/* Display the name of the selected league */}
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
                      <td>{row[0]}</td>
                      <td>{row[1]}</td>
                      <td>{row[2]}</td>
                      <td>{row[3]}</td>
                      <td>{row[4]}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5">No data available</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default MarketLeagues;
