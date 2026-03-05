import React, { useState, useEffect, useMemo } from 'react';
import './LongOnlyWatchlist.css';

function LongOnlyWatchlist() {
  const [originalData, setOriginalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null }); // 'desc' | 'asc' | null

  const getDefaultDate = () => {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - 1);
    if (day === 0) d.setDate(d.getDate() - 1);
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
      const rows = Array.isArray(json) ? json : [];
      setOriginalData(rows);
      setSortConfig({ key: null, direction: null }); // always default on load
    } catch (err) {
      console.error('Fetch long-only watchlist error:', err);
      setOriginalData([]);
      setSortConfig({ key: null, direction: null });
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

    if (colName === 'security_long_name' || colName === 'investment_type_name') return val;

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

  const headerLabel = (key) => {
    if (key === 'security_long_name') return 'NAME';
    if (key === 'investment_type_name') return 'TYPE';
    if (key === 'price_date') return 'Date';
    return key.replace('_RETURN', '').toUpperCase();
  };

  const isSortable = (key) =>
    key !== 'security_long_name' && key !== 'investment_type_name' && key !== 'price_date';

  const cycleSort = (key) => {
    if (!isSortable(key)) return;

    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: 'desc' };
      if (prev.direction === 'desc') return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key: null, direction: null }; // reset to default
      return { key, direction: 'desc' };
    });
  };

  const sortIndicator = (key) => {
    if (sortConfig.key !== key) return '';
    if (sortConfig.direction === 'desc') return ' ▼';
    if (sortConfig.direction === 'asc') return ' ▲';
    return '';
  };

  const displayedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return originalData;

    const key = sortConfig.key;
    const dir = sortConfig.direction;

    const withIndex = originalData.map((row, idx) => ({ row, idx }));

    withIndex.sort((a, b) => {
      const av = a.row?.[key];
      const bv = b.row?.[key];

      const aNum = typeof av === 'number' ? av : av == null ? null : Number(av);
      const bNum = typeof bv === 'number' ? bv : bv == null ? null : Number(bv);

      const aMissing = aNum === null || Number.isNaN(aNum);
      const bMissing = bNum === null || Number.isNaN(bNum);

      if (aMissing && bMissing) return a.idx - b.idx;
      if (aMissing) return 1;
      if (bMissing) return -1;

      if (aNum === bNum) return a.idx - b.idx;
      return dir === 'desc' ? bNum - aNum : aNum - bNum;
    });

    return withIndex.map((x) => x.row);
  }, [originalData, sortConfig]);

  const renderTable = () => {
    if (loading) return <p className="lw-error">Loading...</p>;
    if (!displayedData || displayedData.length === 0) return <p className="lw-error">No data.</p>;

    return (
      <table className="lw-table">
        <thead>
          <tr className="lw-table-header">
            {columnKeys.map((key) => (
              <th
                key={key}
                onClick={() => cycleSort(key)}
                style={{ cursor: isSortable(key) ? 'pointer' : 'default', userSelect: 'none' }}
                title={isSortable(key) ? 'Click to sort: best→worst, worst→best, reset' : undefined}
              >
                {headerLabel(key)}
                {sortIndicator(key)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {displayedData.map((row, idx) => (
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

        <div className="lw-hint">Pick a date to load the watchlist period-end returns.</div>
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