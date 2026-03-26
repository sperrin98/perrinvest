import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import "./RebasedComparison.css";

const formatDateYYYYMMDD = (dateStr) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const normalizePriceHistory = (raw) => {
  const rows = Array.isArray(raw) ? raw : [];
  const out = [];

  for (const r of rows) {
    if (Array.isArray(r)) {
      const dateVal = r[1];
      const priceVal = r[2];
      if (dateVal != null && priceVal != null) {
        const date = formatDateYYYYMMDD(dateVal);
        const price = Number(priceVal);
        if (!Number.isNaN(price)) out.push({ date, price });
      }
    } else if (r && typeof r === "object") {
      const dateVal = r.price_date ?? r.date;
      const priceVal = r.price ?? r.close ?? r.value;
      if (dateVal != null && priceVal != null) {
        const date = formatDateYYYYMMDD(dateVal);
        const price = Number(priceVal);
        if (!Number.isNaN(price)) out.push({ date, price });
      }
    }
  }

  out.sort((a, b) => new Date(a.date) - new Date(b.date));
  return out;
};

const filterByDateRange = (rows, startDate, endDate) => {
  return rows.filter((row) => {
    if (startDate && row.date < startDate) return false;
    if (endDate && row.date > endDate) return false;
    return true;
  });
};

const getWeekKey = (dateStr) => {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const start = new Date(Date.UTC(year, 0, 1));
  const diff = Math.floor((d - start) / 86400000);
  const week = Math.floor(diff / 7) + 1;
  return `${year}-W${String(week).padStart(2, "0")}`;
};

const getMonthKey = (dateStr) => dateStr.slice(0, 7);

const getQuarterKey = (dateStr) => {
  const d = new Date(dateStr);
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `${d.getFullYear()}-Q${q}`;
};

const resampleSeries = (rows, frequency) => {
  if (frequency === "DAILY") return rows;

  const grouped = new Map();

  rows.forEach((row) => {
    let key;
    if (frequency === "WEEKLY") key = getWeekKey(row.date);
    else if (frequency === "MONTHLY") key = getMonthKey(row.date);
    else if (frequency === "QUARTERLY") key = getQuarterKey(row.date);
    else key = row.date;

    grouped.set(key, row);
  });

  return Array.from(grouped.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
};

const rebaseSeries = (rows) => {
  if (!rows.length) return [];

  const baseRow = rows.find(
    (row) =>
      row.price !== null &&
      row.price !== undefined &&
      !Number.isNaN(Number(row.price))
  );

  if (!baseRow) return [];

  const basePrice = Number(baseRow.price);
  if (!basePrice || Number.isNaN(basePrice)) return [];

  return rows.map((row) => ({
    date: row.date,
    value:
      row.price === null ||
      row.price === undefined ||
      Number.isNaN(Number(row.price))
        ? null
        : (Number(row.price) / basePrice) * 100,
  }));
};

const mergeSeries = (seriesMap) => {
  const byDate = new Map();

  Object.entries(seriesMap).forEach(([label, rows]) => {
    rows.forEach((row) => {
      if (!byDate.has(row.date)) byDate.set(row.date, { date: row.date });
      byDate.get(row.date)[label] = row.value;
    });
  });

  return Array.from(byDate.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
};

const COLORS = ["#00796b", "#1e88e5", "#fb8c00", "#e53935", "#8e24aa"];

function RebasedComparison() {
  const API_URL = process.env.REACT_APP_API_URL;

  const [securities, setSecurities] = useState([]);
  const [selectedSecurities, setSelectedSecurities] = useState([]);
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [startDate, setStartDate] = useState("2020-01-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [frequency, setFrequency] = useState("MONTHLY");

  const [chartData, setChartData] = useState([]);
  const [seriesNames, setSeriesNames] = useState([]);
  const [summaryRows, setSummaryRows] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    async function fetchSecurities() {
      try {
        const response = await axios.get(`${API_URL}/securities`);
        setSecurities(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Error fetching securities:", err);
        setError("Failed to load securities.");
      }
    }

    fetchSecurities();
  }, [API_URL]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatSecurityLabel = (security) => {
    const name = security.security_long_name || "Unknown";
    const ticker = security.ticker ? ` (${security.ticker})` : "";
    return `${name}${ticker}`;
  };

  const filteredSecurities = useMemo(() => {
    const q = query.trim().toLowerCase();
    const available = securities.filter(
      (sec) =>
        !selectedSecurities.some(
          (selected) => selected.security_id === sec.security_id
        )
    );

    if (!q) return available;

    return available.filter((sec) => {
      const longName = (sec.security_long_name || "").toLowerCase();
      const ticker = (sec.ticker || "").toLowerCase();
      return longName.includes(q) || ticker.includes(q);
    });
  }, [query, securities, selectedSecurities]);

  const handleAddSecurity = (security) => {
    if (selectedSecurities.length >= 5) return;
    setSelectedSecurities((prev) => [...prev, security]);
    setQuery("");
    setDropdownOpen(false);
  };

  const handleRemoveSecurity = (securityId) => {
    setSelectedSecurities((prev) =>
      prev.filter((sec) => sec.security_id !== securityId)
    );
  };

  const handleLoad = async () => {
    setHasLoaded(true);
    setLoading(true);
    setError("");
    setChartData([]);
    setSeriesNames([]);
    setSummaryRows([]);

    try {
      if (selectedSecurities.length < 2) {
        throw new Error("Select at least 2 securities.");
      }

      const responses = await Promise.all(
        selectedSecurities.map((security) =>
          axios.get(`${API_URL}/securities/${security.security_id}/price-histories`)
        )
      );

      const seriesMap = {};
      const summary = [];

      responses.forEach((response, index) => {
        const security = selectedSecurities[index];
        const label =
          security.ticker ||
          security.security_short_name ||
          security.security_long_name;

        let rows = normalizePriceHistory(response.data);
        rows = filterByDateRange(rows, startDate, endDate);
        rows = resampleSeries(rows, frequency);

        const rebasedRows = rebaseSeries(rows);

        if (rebasedRows.length > 0) {
          seriesMap[label] = rebasedRows;

          const firstRow = rebasedRows[0];
          const lastRow = rebasedRows[rebasedRows.length - 1];

          summary.push({
            name: label,
            baseDate: firstRow.date,
            currentValue: lastRow.value,
            totalReturn: lastRow.value - 100,
          });
        }
      });

      const merged = mergeSeries(seriesMap);

      setChartData(merged);
      setSeriesNames(Object.keys(seriesMap));
      setSummaryRows(summary);

      if (Object.keys(seriesMap).length === 0) {
        setError("No valid data found for the selected securities and dates.");
      }
    } catch (err) {
      console.error("Error loading rebased comparison:", err);
      setError(err.message || "Failed to load rebased comparison.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rbcContainer">
      <aside className="rbcSidebar">
        <div className="rbcSidebarTitle">Rebased Comparison</div>

        <div className="rbcFilterBlock" ref={dropdownRef}>
          <label className="rbcFilterLabel">Select Securities</label>
          <input
            type="text"
            className="rbcInput"
            placeholder="Search securities..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
          />

          {dropdownOpen && (
            <div className="rbcDropdown">
              {filteredSecurities.length > 0 ? (
                filteredSecurities.map((security) => (
                  <button
                    key={security.security_id}
                    type="button"
                    className="rbcDropdownItem"
                    onClick={() => handleAddSecurity(security)}
                  >
                    {formatSecurityLabel(security)}
                  </button>
                ))
              ) : (
                <div className="rbcDropdownEmpty">No matches</div>
              )}
            </div>
          )}

          <div className="rbcSelectedList">
            {selectedSecurities.map((security) => (
              <div key={security.security_id} className="rbcSelectedItem">
                <span>{formatSecurityLabel(security)}</span>
                <button
                  type="button"
                  className="rbcRemoveBtn"
                  onClick={() => handleRemoveSecurity(security.security_id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rbcFilterBlock">
          <label className="rbcFilterLabel">Base Date</label>
          <input
            type="date"
            className="rbcInput"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="rbcFilterBlock">
          <label className="rbcFilterLabel">End Date</label>
          <input
            type="date"
            className="rbcInput"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="rbcFilterBlock">
          <label className="rbcFilterLabel">Frequency</label>
          <select
            className="rbcInput"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            <option value="DAILY">DAILY</option>
            <option value="WEEKLY">WEEKLY</option>
            <option value="MONTHLY">MONTHLY</option>
            <option value="QUARTERLY">QUARTERLY</option>
          </select>
        </div>

        <button
          type="button"
          className="rbcLoadButton"
          onClick={handleLoad}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load Comparison"}
        </button>

        {error && <div className="rbcError">{error}</div>}
      </aside>

      <main className="rbcMain">
        <div className="rbcTitle">Rebased Comparison</div>
        <div className="rbcSubtitle">Base = 100 from selected base date</div>

        <section className="rbcChartCard">
          {hasLoaded && chartData.length > 0 ? (
            <div className="rbcChartWrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {seriesNames.map((name, index) => (
                    <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    stroke={COLORS[index % COLORS.length]}
                    dot={false}
                    strokeWidth={2}
                    connectNulls={true}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rbcEmptyState">
              {loading
                ? "Loading comparison..."
                : hasLoaded
                ? "No data available"
                : "Select 2 to 5 securities and load comparison."}
            </div>
          )}
        </section>

        <section className="rbcTableCard">
          <div className="rbcTableHeader">
            <div className="rbcTableTitle">Summary</div>
            <div className="rbcTableMeta">
              {summaryRows.length} {summaryRows.length === 1 ? "series" : "series"}
            </div>
          </div>

          <div className="rbcTableWrapper">
            <table className="rbcTable">
              <thead>
                <tr>
                  <th>Series</th>
                  <th>Base Date</th>
                  <th>Current Rebased</th>
                  <th>Return Since Base</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.length > 0 ? (
                  summaryRows.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.baseDate}</td>
                      <td>{row.currentValue.toFixed(2)}</td>
                      <td
                        className={
                          row.totalReturn >= 0 ? "rbcPositive" : "rbcNegative"
                        }
                      >
                        {row.totalReturn >= 0 ? "+" : ""}
                        {row.totalReturn.toFixed(2)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="rbcNoData">
                      {hasLoaded ? "No summary data available" : "No data loaded yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default RebasedComparison;