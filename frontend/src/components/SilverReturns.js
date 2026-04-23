import React, { useEffect, useMemo, useState } from "react";
import "./SilverReturns.css";

const SilverReturns = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currencies = useMemo(
    () => [
      "USD",
      "EUR",
      "GBP",
      "NOK",
      "JPY",
      "CAD",
      "AUD",
      "NZD",
      "CHF",
      "BRL",
      "MXN",
      "ZAR",
      "CNY",
      "IDR",
      "INR",
      "KRW",
      "MYR",
      "SGD",
      "CZK",
      "PLN",
      "HUF",
    ],
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/returns/2`);
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();

        const sortedData = Array.isArray(result)
          ? [...result].sort((a, b) => {
              const yearA = Number(a.yr ?? a.YR ?? a.year ?? 0);
              const yearB = Number(b.yr ?? b.YR ?? b.year ?? 0);
              return yearB - yearA;
            })
          : [];

        setData(sortedData);
        setError(null);
      } catch (err) {
        setError(err.message);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toneClass = (value) => {
    if (value > 0) return "silver-positive";
    if (value < 0) return "silver-negative";
    return "silver-neutral";
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined || value === "") return "";
    return `${value}%`;
  };

  if (loading) return <div className="silver-loading">Loading...</div>;
  if (error) return <div className="silver-error">{`Error: ${error}`}</div>;

  return (
    <div className="silver-container">
      <div className="silver-inner">
        <h1 className="silver-title">Annual Silver Price Returns in World Currencies</h1>

        <section className="silver-table-card">
          <div className="silver-table-card-header">
            <div className="silver-table-heading">Annual Returns</div>
            <div className="silver-table-meta">
              {data.length} {data.length === 1 ? "year" : "years"}
            </div>
          </div>

          <div className="silver-mobile-scroll-hint">
            Swipe sideways to view full table
          </div>

          <div className="silver-table-wrapper">
            <table className="silver-table">
              <thead>
                <tr>
                  <th className="silver-year-column">Year</th>
                  {currencies.map((curr) => (
                    <th key={curr}>{curr}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((row, index) => (
                    <tr key={index} className="silver-row">
                      <td className="silver-year-column">
                        {row.yr ?? row.YR ?? row.year}
                      </td>
                      {currencies.map((curr) => (
                        <td key={curr} className={toneClass(row[curr])}>
                          {formatPercent(row[curr])}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr className="silver-row">
                    <td colSpan={currencies.length + 1} className="silver-no-data">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SilverReturns;