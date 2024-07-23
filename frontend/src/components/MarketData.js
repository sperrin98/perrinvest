import React, { useState, useEffect } from 'react';
import axios from 'axios';

function MarketData() {
  const [data, setData] = useState({
    gold: [],
    silver: [],
    ftse: [],
    nasdaq: [],
    dow: []
  });

  useEffect(() => {
    axios.get('http://localhost:5000/market-data')
      .then(response => {
        console.log('Data fetched from backend:', response.data);  // Debug log
        setData(response.data);
      })
      .catch(error => {
        console.error('Error fetching market data:', error);
      });
  }, []);

  const renderTable = (title, marketData) => (
    <div key={title}>
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Open</th>
            <th>High</th>
            <th>Low</th>
            <th>Close</th>
            <th>Volume</th>
          </tr>
        </thead>
        <tbody>
          {marketData.map((entry, index) => (
            <tr key={index}>
              <td>{new Date(entry.Date).toISOString().split('T')[0]}</td>
              <td>{entry.Open}</td>
              <td>{entry.High}</td>
              <td>{entry.Low}</td>
              <td>{entry.Close}</td>
              <td>{entry.Volume}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <h1>Market Data</h1>
      {renderTable("Gold", data.gold)}
      {renderTable("Silver", data.silver)}
      {renderTable("FTSE 100", data.ftse)}
      {renderTable("NASDAQ", data.nasdaq)}
      {renderTable("Dow Jones", data.dow)}
    </div>
  );
}

export default MarketData;
