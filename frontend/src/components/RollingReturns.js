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
import "./RollingReturns.css";

const COLORS = {
  "1Y": "#00796b",
  "3Y": "#1e88e5",
  "5Y": "#fb8c00",
  "10Y": "#e53935",
};

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

const filterByDateRange = (rows, startDate, endDate) => {
  return rows.filter((row) => {
    if (startDate && row.date < startDate) return false;
    if (endDate && row.date > endDate) return false;
    return true;
  });
};

const calculateRollingReturn = (rows, years) => {
  if (!rows.length) return [];

  return rows.map((row, index) => {
    const targetDate = new Date(row.date);
    targetDate.setFullYear(targetDate.getFullYear() - years);

    let baseIndex = -1;

    for (let i = index - 1; i >= 0; i -= 1) {
      const d = new Date(rows[i].date);
      if (d <= targetDate) {
        baseIndex = i;
        break;
      }
    }

    if (baseIndex === -1) {
      return { date: row.date, value: null };
    }

    const currentPrice = Number(row.price);
    const basePrice = Number(rows[baseIndex].price);

    if (
      !currentPrice ||
      !basePrice ||
      Number.isNaN(currentPrice) ||
      Number.isNaN(basePrice)
    ) {
      return { date: row.date, value: null };
    }

    if (years === 1) {
      return {
        date: row.date,
        value: ((currentPrice / basePrice) - 1) * 100,
      };
    }

    return {
      date: row.date,
      value: (Math.pow(currentPrice / basePrice, 1 / years) - 1) * 100,
    };
  });
};

const mergeRollingSeries = (seriesMap) => {
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

function RollingReturns() {
  const API_URL = process.env.REACT_APP_API_URL;

  const [securities, setSecurities] = useState([]);
  const [selectedSecurity, setSelectedSecurity] = useState(null);
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [frequency, setFrequency] = useState("MONTHLY");
  const [startDate, setStartDate] = useState("2000-01-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const [chartData, setChartData] = useState([]);
  const [summaryRows, setSummaryRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);

  const dropdownRef = useRef(null);
  const chartScrollRef = useRef(null);

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

  useEffect(() => {
    if (!hasLoaded || chartData.length === 0) return;
    if (window.innerWidth > 650) return;

    const timer = setTimeout(() => {
      if (chartScrollRef.current) {
        chartScrollRef.current.scrollLeft = chartScrollRef.current.scrollWidth;
      }
    }, 80);

    return () => clearTimeout(timer);
  }, [chartData, hasLoaded]);

  const filteredSecurities = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return securities;

    return securities.filter((sec) => {
      const longName = (sec.security_long_name || "").toLowerCase();
      const ticker = (sec.ticker || "").toLowerCase();
      return longName.includes(q) || ticker.includes(q);
    });
  }, [query, securities]);

  const formatSecurityLabel = (security) => {
    const name = security.security_long_name || "Unknown";
    const ticker = security.ticker ? ` (${security.ticker})` : "";
    return `${name}${ticker}`;
  };

  const handleLoad = async () => {
    setHasLoaded(true);
    setLoading(true);
    setError("");
    setChartData([]);
    setSummaryRows([]);

    try {
      if (!selectedSecurity) {
        throw new Error("Select a security.");
      }

      const response = await axios.get(
        `${API_URL}/securities/${selectedSecurity.security_id}/price-histories`
      );

      let rows = normalizePriceHistory(response.data);
      rows = filterByDateRange(rows, startDate, endDate);
      rows = resampleSeries(rows, frequency);

      const rolling1Y = calculateRollingReturn(rows, 1);
      const rolling3Y = calculateRollingReturn(rows, 3);
      const rolling5Y = calculateRollingReturn(rows, 5);
      const rolling10Y = calculateRollingReturn(rows, 10);

      const merged = mergeRollingSeries({
        "1Y": rolling1Y,
        "3Y": rolling3Y,
        "5Y": rolling5Y,
        "10Y": rolling10Y,
      });

      setChartData(merged);

      const latest = merged[merged.length - 1] || {};

      setSummaryRows([
        { label: "1Y Rolling Return", value: latest["1Y"] },
        { label: "3Y Rolling CAGR", value: latest["3Y"] },
        { label: "5Y Rolling CAGR", value: latest["5Y"] },
        { label: "10Y Rolling CAGR", value: latest["10Y"] },
      ]);

      if (!merged.length) {
        setError("No valid rolling return data found for this security.");
      }
    } catch (err) {
      console.error("Error loading rolling returns:", err);
      setError(err.message || "Failed to load rolling returns.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rrContainer">
      <aside className="rrSidebar">
        <div className="rrSidebarTitle">Rolling Return / CAGR</div>

        <div className="rrFilterBlock" ref={dropdownRef}>
          <label className="rrFilterLabel">Select Security</label>
          <input
            type="text"
            className="rrInput"
            placeholder="Search security..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
          />

          {dropdownOpen && (
            <div className="rrDropdown">
              {filteredSecurities.length > 0 ? (
                filteredSecurities.map((security) => (
                  <button
                    key={security.security_id}
                    type="button"
                    className="rrDropdownItem"
                    onClick={() => {
                      setSelectedSecurity(security);
                      setQuery(formatSecurityLabel(security));
                      setDropdownOpen(false);
                    }}
                  >
                    {formatSecurityLabel(security)}
                  </button>
                ))
              ) : (
                <div className="rrDropdownEmpty">No matches</div>
              )}
            </div>
          )}
        </div>

        <div className="rrFilterBlock">
          <label className="rrFilterLabel">Start Date</label>
          <input
            type="date"
            className="rrInput"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="rrFilterBlock">
          <label className="rrFilterLabel">End Date</label>
          <input
            type="date"
            className="rrInput"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="rrFilterBlock">
          <label className="rrFilterLabel">Frequency</label>
          <select
            className="rrInput"
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
          className="rrLoadButton"
          onClick={handleLoad}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load Rolling Returns"}
        </button>

        {error && <div className="rrError">{error}</div>}
      </aside>

      <main className="rrMain">
        <div className="rrTitle">
          {selectedSecurity
            ? `Rolling Return / CAGR: ${
                selectedSecurity.security_long_name ||
                selectedSecurity.ticker ||
                "Security"
              }`
            : "Rolling Return / CAGR"}
        </div>

        <section className="rrChartCard">
          <div className="rrMobileScrollHint">
            Swipe sideways to view the full chart
          </div>

          {hasLoaded && chartData.length > 0 ? (
            <div className="rrChartScroll" ref={chartScrollRef}>
              <div className="rrChartWrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} />
                    <Tooltip
                      formatter={(value) =>
                        value == null ? "-" : `${Number(value).toFixed(2)}%`
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="1Y"
                      stroke={COLORS["1Y"]}
                      dot={false}
                      strokeWidth={2}
                      connectNulls={true}
                    />
                    <Line
                      type="monotone"
                      dataKey="3Y"
                      stroke={COLORS["3Y"]}
                      dot={false}
                      strokeWidth={2}
                      connectNulls={true}
                    />
                    <Line
                      type="monotone"
                      dataKey="5Y"
                      stroke={COLORS["5Y"]}
                      dot={false}
                      strokeWidth={2}
                      connectNulls={true}
                    />
                    <Line
                      type="monotone"
                      dataKey="10Y"
                      stroke={COLORS["10Y"]}
                      dot={false}
                      strokeWidth={2}
                      connectNulls={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="rrEmptyState">
              {loading
                ? "Loading rolling returns..."
                : hasLoaded
                ? "No data available"
                : "Select a security and load rolling returns."}
            </div>
          )}
        </section>

        <section className="rrTableCard">
          <div className="rrTableHeader">
            <div className="rrTableTitle">Latest Values</div>
          </div>

          <div className="rrTableWrapper">
            <table className="rrTable">
              <thead>
                <tr>
                  <th>Measure</th>
                  <th>Latest</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.length > 0 ? (
                  summaryRows.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td className={row.value >= 0 ? "rrPositive" : "rrNegative"}>
                        {row.value == null
                          ? "-"
                          : `${row.value >= 0 ? "+" : ""}${row.value.toFixed(2)}%`}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="rrNoData">
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

export default RollingReturns;