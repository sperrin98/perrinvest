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
  const [selectedDate, setSelectedDate] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [constituentData, setConstituentData] = useState([]);
  const [selectedConstituentName, setSelectedConstituentName] = useState('');

  useEffect(() => {
    const fetchMarketLeagues = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        const response = await axios.get(`${apiUrl}/market_leagues`);
        setMarketLeagues(response.data);

        if (response.data.length > 0) {
          const previousBusinessDay = await getPreviousBusinessDay();
          fetchLeagueTable(response.data[0][0], response.data[0][1], previousBusinessDay);
        }
      } catch (error) {
        console.error('Error fetching market leagues:', error);
        setErrorMessage('Error fetching market leagues');
      }
    };

    fetchMarketLeagues();
  }, []);

  const getPreviousBusinessDay = async () => {
    let date = new Date();
    date.setDate(date.getDate() - 1); // Start from yesterday

    while (date.getDay() === 0 || date.getDay() === 6 || await isBankHoliday(date)) {
      date.setDate(date.getDate() - 1);
    }

    setSelectedDate(date);
    return date;
  };

  const isBankHoliday = async (date) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const formattedDate = date.toISOString().split('T')[0];
      const response = await axios.get(`${apiUrl}/is_bank_holiday/${formattedDate}`);
      return response.data.is_holiday;
    } catch (error) {
      console.error('Error checking bank holiday:', error);
      return false;
    }
  };

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

  const fetchConstituentData = async (constituentId, constituentName) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL;
      const response = await axios.get(`${apiUrl}/get_market_league_data/${constituentId}`);

      if (response.data.error) {
        setErrorMessage(response.data.error);
        setConstituentData([]);
        setSelectedConstituentName('');
      } else {
        setConstituentData(response.data);
        setSelectedConstituentName(constituentName);
        setErrorMessage('');
      }
    } catch (error) {
      console.error('Error fetching constituent data:', error);
      setErrorMessage('Error fetching constituent data');
      setSelectedConstituentName('');
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (selectedLeagueId) {
      fetchLeagueTable(selectedLeagueId, selectedLeagueName, date);
    }
  };

  const formatPercentage = (value) => {
    return value ? `${(value * 100).toFixed(2)}%` : '0.00%';
  };

  const formatDecimal = (value) => {
    return value ? value.toFixed(2) : '0.00';
  };

  const lineChartData = {
    labels: constituentData.map((row) => new Date(row[0]).toISOString().split('T')[0]),
    datasets: [
      {
        label: 'Relative Index',
        data: constituentData.map((row) => row[1]),
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
        pointRadius: 0.5,
      },
      {
        label: 'Short EMA',
        data: constituentData.map((row) => row[2]),
        borderColor: 'rgba(153,102,255,1)',
        fill: false,
        pointRadius: 0.5,
      },
      {
        label: 'Long EMA',
        data: constituentData.map((row) => row[3]),
        borderColor: 'rgba(255,159,64,1)',
        fill: false,
        pointRadius: 0.5,
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

      <div className="league-table-container">
        <h2>League Table for {selectedLeagueName || 'Loading...'}</h2>
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
                <tr key={index} onClick={() => fetchConstituentData(row[0], row[1])}>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                  <td>{formatPercentage(row[3])}</td>
                  <td>{formatPercentage(row[4])}</td>
                  <td>{formatDecimal(row[5])}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5">{errorMessage || 'No data available'}</td></tr>
            )}
          </tbody>
        </table>

        {constituentData.length > 0 && selectedConstituentName && (
          <div className="constituent-data-container">
            <h3>{selectedConstituentName}</h3>
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketLeagues;
