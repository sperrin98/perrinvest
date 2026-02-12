import React, { useEffect, useState } from 'react';
import './GoldReturns.css';

const GoldReturns = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/returns/1`);
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="gold-loading">Loading...</div>;
  if (error) return <div className="gold-error">{`Error: ${error}`}</div>;

  return (
    <div className="gold-container">
      <h1 className="gold-title">Annual Gold Price Returns in World Currencies</h1>
      <div className="gold-table-wrapper">
        <table className="gold-table">
          <thead>
            <tr className="gold-table-header">
              <th className="gold-year-column">Year</th>
              <th>EUR</th>
              <th>GBP</th>
              <th>NOK</th>
              <th>JPY</th>
              <th>CAD</th>
              <th>AUD</th>
              <th>NZD</th>
              <th>CHF</th>
              <th>BRL</th>
              <th>MXN</th>
              <th>ZAR</th>
              <th>CNY</th>
              <th>IDR</th>
              <th>INR</th>
              <th>KRW</th>
              <th>MYR</th>
              <th>SGD</th>
              <th>CZK</th>
              <th>PLN</th>
              <th>HUF</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td className="gold-year-column">{row.yr}</td>
                {['EUR','GBP','NOK','JPY','CAD','AUD','NZD','CHF','BRL','MXN','ZAR','CNY','IDR','INR','KRW','MYR','SGD','CZK','PLN','HUF']
                  .map((curr) => (
                    <td
                      key={curr}
                      className={row[curr] < 0 ? 'gold-negative' : 'gold-positive'}
                    >
                      {row[curr] != null ? `${row[curr]}%` : ''}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GoldReturns;
