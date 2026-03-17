import React, { useState, useEffect, useMemo } from "react";
import "./LongOnlyWatchlist.css";

function LongOnlyWatchlist() {
  const [originalData, setOriginalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const getDefaultDate = () => {
    const d = new Date();
    const day = d.getDay();

    d.setDate(d.getDate() - 1);
    if (day === 0) d.setDate(d.getDate() - 1);
    if (day === 1) d.setDate(d.getDate() - 2);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [date, setDate] = useState(getDefaultDate());

  const fetchWatchlist = async (selectedDate) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/long-only-watchlist?date=${selectedDate}&_=${Date.now()}`,
        { cache: "no-store", headers: { "Cache-Control": "no-cache" } }
      );

      const json = await res.json();
      const rows = Array.isArray(json) ? json : [];
      setOriginalData(rows);
      setSortConfig({ key: null, direction: null });
    } catch (err) {
      console.error("Fetch long-only watchlist error:", err);
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
    if (val === null || val === undefined) return "";

    if (colName === "security_long_name" || colName === "investment_type_name") {
      return val;
    }

    if (colName.toLowerCase().includes("date")) {
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return String(val);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }

    if (typeof val === "number") return `${(val * 100).toFixed(1)}%`;

    return val;
  };

  const columnKeys = [
    "security_long_name",
    "investment_type_name",
    "price_date",
    "DAY_RETURN",
    "MTD_RETURN",
    "QTD_RETURN",
    "YTD_RETURN",
    "3YR_RETURN",
    "5YR_RETURN",
    "10YR_RETURN",
    "CTD_RETURN",
  ];

  const headerLabel = (key) => {
    if (key === "security_long_name") return "NAME";
    if (key === "investment_type_name") return "TYPE";
    if (key === "price_date") return "Date";
    return key.replace("_RETURN", "").toUpperCase();
  };

  const isSortable = (key) =>
    key !== "security_long_name" &&
    key !== "investment_type_name" &&
    key !== "price_date";

  const cycleSort = (key) => {
    if (!isSortable(key)) return;

    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "desc" };
      if (prev.direction === "desc") return { key, direction: "asc" };
      if (prev.direction === "asc") return { key: null, direction: null };
      return { key, direction: "desc" };
    });
  };

  const sortIndicator = (key) => {
    if (sortConfig.key !== key) return "";
    if (sortConfig.direction === "desc") return " ▼";
    if (sortConfig.direction === "asc") return " ▲";
    return "";
  };

  const toneClass = (raw, key) => {
    if (
      key === "security_long_name" ||
      key === "investment_type_name" ||
      key === "price_date"
    ) {
      return "";
    }

    if (typeof raw !== "number") return "";
    if (raw > 0) return "lw-positive";
    if (raw < 0) return "lw-negative";
    return "lw-neutral";
  };

  const displayedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return originalData;

    const key = sortConfig.key;
    const dir = sortConfig.direction;

    const withIndex = originalData.map((row, idx) => ({ row, idx }));

    withIndex.sort((a, b) => {
      const av = a.row?.[key];
      const bv = b.row?.[key];

      const aNum = typeof av === "number" ? av : av == null ? null : Number(av);
      const bNum = typeof bv === "number" ? bv : bv == null ? null : Number(bv);

      const aMissing = aNum === null || Number.isNaN(aNum);
      const bMissing = bNum === null || Number.isNaN(bNum);

      if (aMissing && bMissing) return a.idx - b.idx;
      if (aMissing) return 1;
      if (bMissing) return -1;

      if (aNum === bNum) return a.idx - b.idx;
      return dir === "desc" ? bNum - aNum : aNum - bNum;
    });

    return withIndex.map((x) => x.row);
  }, [originalData, sortConfig]);

  const renderTableCard = () => {
    return (
      <section className="lw-table-card">
        <div className="lw-table-card-header">
          <div className="lw-table-heading">Watchlist Returns</div>
          <div className="lw-table-meta">
            {loading ? "Loading..." : `${displayedData.length} rows`}
          </div>
        </div>

        {loading ? (
          <p className="lw-message">Loading...</p>
        ) : !displayedData || displayedData.length === 0 ? (
          <p className="lw-message">No data.</p>
        ) : (
          <div className="lw-table-wrapper">
            <table className="lw-table">
              <colgroup>
                <col className="lw-col-name" />
                <col className="lw-col-type" />
                <col className="lw-col-date" />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
                <col />
              </colgroup>

              <thead>
                <tr>
                  {columnKeys.map((key) => (
                    <th
                      key={key}
                      onClick={() => cycleSort(key)}
                      className={isSortable(key) ? "lw-sortable" : ""}
                      title={
                        isSortable(key)
                          ? "Click to sort: best→worst, worst→best, reset"
                          : undefined
                      }
                    >
                      {headerLabel(key)}
                      {sortIndicator(key)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {displayedData.map((row, idx) => (
                  <tr key={idx} className="lw-row">
                    {columnKeys.map((key) => {
                      const raw = row?.[key];
                      const val = formatValue(raw, key);

                      return (
                        <td key={key} className={toneClass(raw, key)}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="lw-container">
      <aside className="lw-sidebar">
        <div className="lw-date-section">
          <label className="lw-date-label" htmlFor="lw-date-picker">
            Select Date
          </label>
          <input
            id="lw-date-picker"
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
      </aside>

      <main className="lw-main">
        <div className="lw-main-inner">
          <h1 className="lw-title">UK Shares and ETF Watchlist</h1>
          {renderTableCard()}
        </div>
      </main>
    </div>
  );
}

export default LongOnlyWatchlist;