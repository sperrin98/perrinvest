import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import { Line } from 'react-chartjs-2';
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

  const fetchLeagueTable = async (leagueId, leagueName, date) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const formattedDate = date.toISOString().split('T')[0];
      const response = await axios.get(`${apiUrl}/market_league_table/${leagueId}/${formattedDate}`);
      setLeagueTable(response.data);
      setSelectedLeagueId(leagueId);
      setSelectedLeagueName(leagueName);
      setConstituentData([]);
      setErrorMessage('');
    } catch (error) {
      console.error('Error fetching league table:', error);
      setErrorMessage('Error fetching league data');
    }
  };

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

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (selectedLeagueId) {
      fetchLeagueTable(selectedLeagueId, selectedLeagueName, date);
    }
  };

  // Prepare data for the line graph
  const lineChartData = {
    labels: constituentData.map((row) => new Date(row[0]).toISOString().split('T')[0]), // Format dates as YYYY-MM-DD
    datasets: [
      {
        label: 'Relative Index',
        data: constituentData.map((row) => row[1]),
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
        pointRadius: 1, // Smaller points
      },
      {
        label: 'Short EMA',
        data: constituentData.map((row) => row[2]),
        borderColor: 'rgba(153,102,255,1)',
        fill: false,
        pointRadius: 1, // Smaller points
      },
      {
        label: 'Long EMA',
        data: constituentData.map((row) => row[3]),
        borderColor: 'rgba(255,159,64,1)',
        fill: false,
        pointRadius: 1, // Smaller points
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Values',
        },
      },
    },
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
                    <td>{row[1]}</td>
                    <td>{row[2]}</td>
                    <td>{row[3]}</td>
                    <td>{row[4]}</td>
                    <td>{row[5]}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5">{errorMessage || 'No data available'}</td></tr>
              )}
            </tbody>
          </table>

          {constituentData.length > 0 && (
            <div className="constituent-data-container">
              <h3>Constituent Data</h3>
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarketLeagues;
