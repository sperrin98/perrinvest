import React, { useState, useEffect } from 'react';
import './LongOnlyWatchlist.css';

function LongOnlyWatchlist() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Default date: yesterday, unless Sunday/Monday -> previous Friday
  const getDefaultDate = () => {
    const d = new Date();
    const day = d.getDay(); // 0=Sun, 1=Mon, 2=Tue, ... 6=Sat

    // Start from yesterday
    d.setDate(d.getDate() - 1);

    // If today is Sunday, yesterday is Saturday -> use previous Friday
    if (day === 0) d.setDate(d.getDate() - 1);

    // If today is Monday, yesterday is Sunday -> use previous Friday
    if (day === 1) d.setDate(d.getDate() - 2);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [date, setDate] = useState(getDefaultDate());

  const fetchWatchlist = async (selectedDate) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/long-only-watchlist?date=${selectedDate}&_=${Date.now()}`,
        { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }
      );

      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Fetch long-only watchlist error:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatValue = (val, colName) => {
    if (val === null || val === undefined) return '';

    if (colName === 'security_long_name' || colName === 'investment_type_name')
      return val;

    if (colName.toLowerCase().includes('date')) {
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return String(val);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }

    if (typeof val === 'number') return (val * 100).toFixed(1) + '%';

    return val;
  };

  const columnKeys = [
    'security_long_name',
    'investment_type_name',
    'price_date',
    'DAY_RETURN',
    'MTD_RETURN',
    'QTD_RETURN',
    'YTD_RETURN',
    '3YR_RETURN',
    '5YR_RETURN',
    '10YR_RETURN',
    'CTD_RETURN',
  ];

  const renderTable = () => {
    if (loading) return <p className="lw-error">Loading...</p>;
    if (!data || data.length === 0) return <p className="lw-error">No data.</p>;

    return (
      <table className="lw-table">
        <thead>
          <tr className="lw-table-header">
            {columnKeys.map((key) => (
              <th key={key}>
                {key === 'security_long_name'
                  ? 'NAME'
                  : key === 'investment_type_name'
                  ? 'TYPE'
                  : key === 'price_date'
                  ? 'Date'
                  : key.replace('_RETURN', '').toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {columnKeys.map((key) => {
                const raw = row?.[key];
                const val = formatValue(raw, key);

                const isNumeric = typeof raw === 'number';
                const isNegative = isNumeric && raw < 0;
                const isPositive = isNumeric && raw >= 0;

                return (
                  <td
                    key={key}
                    className={
                      key !== 'security_long_name' &&
                      key !== 'investment_type_name' &&
                      key !== 'price_date'
                        ? isNegative
                          ? 'lw-negative'
                          : isPositive
                          ? 'lw-positive'
                          : ''
                        : ''
                    }
                  >
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="lw-container">
      <div className="lw-sidebar">
        <div className="lw-date-section">
          <h3>Select Date</h3>
          <input
            type="date"
            value={date}
            className="lw-date-picker"
            onChange={(e) => {
              const newDate = e.target.value;
              setDate(newDate);
              fetchWatchlist(newDate);
            }}
          />
        </div>

        <h2 className="lw-sidebar-title">Long Only Watchlist</h2>

        <div className="lw-hint">
          Pick a date to load the watchlist period-end returns.
        </div>
      </div>

      <div className="lw-main">
        <h1 className="lw-title" style={{ textAlign: 'center' }}>
          UK Shares and ETF Watchlist
        </h1>

        {renderTable()}
      </div>
    </div>
  );
}

export default LongOnlyWatchlist;