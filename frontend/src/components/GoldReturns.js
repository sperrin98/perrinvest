import React, { useEffect, useMemo, useState } from "react";
import "./GoldReturns.css";

const GoldReturns = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currencies = useMemo(
    () => [
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/returns/1`);
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const result = await response.json();
        setData(result || []);
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
    if (value > 0) return "gold-positive";
    if (value < 0) return "gold-negative";
    return "gold-neutral";
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined || value === "") return "";
    return `${value}%`;
  };

  if (loading) return <div className="gold-loading">Loading...</div>;
  if (error) return <div className="gold-error">{`Error: ${error}`}</div>;

  return (
    <div className="gold-container">
      <div className="gold-inner">
        <h1 className="gold-title">Annual Gold Price Returns in World Currencies</h1>

        <section className="gold-table-card">
          <div className="gold-table-card-header">
            <div className="gold-table-heading">Annual Returns</div>
            <div className="gold-table-meta">
              {data.length} {data.length === 1 ? "year" : "years"}
            </div>
          </div>

          <div className="gold-table-wrapper">
            <table className="gold-table">
              <thead>
                <tr>
                  <th className="gold-year-column">Year</th>
                  {currencies.map((curr) => (
                    <th key={curr}>{curr}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((row, index) => (
                    <tr key={index} className="gold-row">
                      <td className="gold-year-column">{row.yr}</td>
                      {currencies.map((curr) => (
                        <td key={curr} className={toneClass(row[curr])}>
                          {formatPercent(row[curr])}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr className="gold-row">
                    <td colSpan={currencies.length + 1} className="gold-no-data">
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

export default GoldReturns;