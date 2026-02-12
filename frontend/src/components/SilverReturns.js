import React, { useEffect, useState } from 'react';
import './SilverReturns.css';

const SilverReturns = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/returns/2`);
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="silver-loading">Loading...</div>;
  if (error) return <div className="silver-error">{`Error: ${error}`}</div>;

  return (
    <div className="silver-container">
      <h1 className="silver-title">Annual Silver Price Returns in World Currencies</h1>
      <div className="silver-table-wrapper">
        <table className="silver-table">
          <thead>
            <tr className="silver-table-header">
              <th className="silver-year-column">Year</th>
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
                <td className="silver-year-column">{row.yr}</td>
                {['EUR','GBP','NOK','JPY','CAD','AUD','NZD','CHF','BRL','MXN','ZAR','CNY','IDR','INR','KRW','MYR','SGD','CZK','PLN','HUF']
                  .map((curr) => (
                    <td
                      key={curr}
                      className={row[curr] < 0 ? 'silver-negative' : 'silver-positive'}
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

export default SilverReturns;
