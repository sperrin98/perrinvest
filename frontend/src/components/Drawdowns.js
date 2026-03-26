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
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import "./Drawdowns.css";

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

const calculateDrawdowns = (rows) => {
  if (!rows.length) {
    return {
      underwaterSeries: [],
      currentDrawdown: null,
      maxDrawdown: null,
      currentDuration: 0,
      maxDuration: 0,
    };
  }

  let runningPeak = -Infinity;
  let currentDuration = 0;
  let maxDuration = 0;
  let maxDrawdown = 0;

  const underwaterSeries = rows.map((row) => {
    const price = Number(row.price);

    if (price > runningPeak) {
      runningPeak = price;
      currentDuration = 0;
    } else {
      currentDuration += 1;
      if (currentDuration > maxDuration) {
        maxDuration = currentDuration;
      }
    }

    const drawdown = runningPeak > 0 ? ((price / runningPeak) - 1) * 100 : 0;

    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
    }

    return {
      date: row.date,
      drawdown,
    };
  });

  const latest = underwaterSeries[underwaterSeries.length - 1];

  return {
    underwaterSeries,
    currentDrawdown: latest ? latest.drawdown : null,
    maxDrawdown,
    currentDuration,
    maxDuration,
  };
};

const getSevereDrawdownEpisodes = (underwaterSeries, threshold = -20) => {
  const episodes = [];
  let inEpisode = false;
  let currentEpisode = null;

  underwaterSeries.forEach((point) => {
    const dd = point.drawdown;

    if (!inEpisode && dd <= threshold) {
      inEpisode = true;
      currentEpisode = {
        breachDate: point.date,
        troughDate: point.date,
        lowReached: dd,
      };
      return;
    }

    if (inEpisode) {
      if (dd < currentEpisode.lowReached) {
        currentEpisode.lowReached = dd;
        currentEpisode.troughDate = point.date;
      }

      if (dd >= 0) {
        episodes.push(currentEpisode);
        inEpisode = false;
        currentEpisode = null;
      }
    }
  });

  if (inEpisode && currentEpisode) {
    episodes.push(currentEpisode);
  }

  return episodes;
};

function Drawdowns() {
  const API_URL = process.env.REACT_APP_API_URL;

  const [securities, setSecurities] = useState([]);
  const [selectedSecurity, setSelectedSecurity] = useState(null);
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [frequency, setFrequency] = useState("MONTHLY");
  const [startDate, setStartDate] = useState("2000-01-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [episodes, setEpisodes] = useState([]);
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
    setSummary(null);
    setEpisodes([]);

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

      const drawdownData = calculateDrawdowns(rows);
      const severeEpisodes = getSevereDrawdownEpisodes(drawdownData.underwaterSeries, -20);

      setChartData(drawdownData.underwaterSeries);
      setEpisodes(severeEpisodes);
      setSummary({
        currentDrawdown: drawdownData.currentDrawdown,
        maxDrawdown: drawdownData.maxDrawdown,
        currentDuration: drawdownData.currentDuration,
        maxDuration: drawdownData.maxDuration,
      });

      if (!drawdownData.underwaterSeries.length) {
        setError("No valid drawdown data found for this security.");
      }
    } catch (err) {
      console.error("Error loading drawdowns:", err);
      setError(err.message || "Failed to load drawdowns.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ddContainer">
      <aside className="ddSidebar">
        <div className="ddSidebarTitle">Drawdowns</div>

        <div className="ddFilterBlock" ref={dropdownRef}>
          <label className="ddFilterLabel">Select Security</label>
          <input
            type="text"
            className="ddInput"
            placeholder="Search security..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
          />

          {dropdownOpen && (
            <div className="ddDropdown">
              {filteredSecurities.length > 0 ? (
                filteredSecurities.map((security) => (
                  <button
                    key={security.security_id}
                    type="button"
                    className="ddDropdownItem"
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
                <div className="ddDropdownEmpty">No matches</div>
              )}
            </div>
          )}
        </div>

        <div className="ddFilterBlock">
          <label className="ddFilterLabel">Start Date</label>
          <input
            type="date"
            className="ddInput"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="ddFilterBlock">
          <label className="ddFilterLabel">End Date</label>
          <input
            type="date"
            className="ddInput"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="ddFilterBlock">
          <label className="ddFilterLabel">Frequency</label>
          <select
            className="ddInput"
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
          className="ddLoadButton"
          onClick={handleLoad}
          disabled={loading}
        >
          {loading ? "Loading..." : "Load Drawdowns"}
        </button>

        {error && <div className="ddError">{error}</div>}
      </aside>

      <main className="ddMain">
        <div className="ddTitle">
          {selectedSecurity
            ? `Drawdowns: ${selectedSecurity.security_long_name || selectedSecurity.ticker || "Security"}`
            : "Drawdowns"}
        </div>

        <section className="ddChartCard">
          {hasLoaded && chartData.length > 0 ? (
            <div className="ddChartWrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} />
                  <Tooltip
                    formatter={(value, name) =>
                      name === "Drawdown"
                        ? [`${Number(value).toFixed(2)}%`, "Drawdown"]
                        : [value, name]
                    }
                    labelFormatter={(label) => label}
                  />
                  <ReferenceLine y={0} stroke="#666" strokeDasharray="4 4" />
                  <ReferenceLine y={-20} stroke="#5c6bc0" strokeDasharray="4 4" />
                  <Line
                    type="monotone"
                    dataKey="drawdown"
                    name="Drawdown"
                    stroke="#e53935"
                    dot={false}
                    strokeWidth={2}
                    connectNulls={true}
                  />
                  {episodes.map((episode) => (
                    <ReferenceDot
                      key={episode.breachDate}
                      x={episode.breachDate}
                      y={-20}
                      r={5}
                      fill="#5c6bc0"
                      stroke="#5c6bc0"
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="ddEmptyState">
              {loading
                ? "Loading drawdowns..."
                : hasLoaded
                ? "No data available"
                : "Select a security and load drawdowns."}
            </div>
          )}
        </section>

        <section className="ddTableCard">
          <div className="ddTableHeader">
            <div className="ddTableTitle">Drawdown Summary</div>
          </div>

          <div className="ddTableWrapper">
            <table className="ddTable">
              <thead>
                <tr>
                  <th>Measure</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {summary ? (
                  <>
                    <tr>
                      <td>Current Drawdown</td>
                      <td className="ddNegative">
                        {summary.currentDrawdown == null
                          ? "-"
                          : `${summary.currentDrawdown.toFixed(2)}%`}
                      </td>
                    </tr>
                    <tr>
                      <td>Max Drawdown</td>
                      <td className="ddNegative">
                        {summary.maxDrawdown == null
                          ? "-"
                          : `${summary.maxDrawdown.toFixed(2)}%`}
                      </td>
                    </tr>
                    <tr>
                      <td>Current Drawdown Duration</td>
                      <td>{summary.currentDuration}</td>
                    </tr>
                    <tr>
                      <td>Max Drawdown Duration</td>
                      <td>{summary.maxDuration}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan="2" className="ddNoData">
                      {hasLoaded ? "No summary data available" : "No data loaded yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="ddTableCard">
          <div className="ddTableHeader">
            <div className="ddTableTitle">Drawdowns Below 20%</div>
            <div className="ddTableMeta">
              {episodes.length} {episodes.length === 1 ? "episode" : "episodes"}
            </div>
          </div>

          <div className="ddTableWrapper">
            <table className="ddTable">
              <thead>
                <tr>
                  <th>Breach Date</th>
                  <th>Trough Date</th>
                  <th>Low Reached</th>
                </tr>
              </thead>
              <tbody>
                {episodes.length > 0 ? (
                  episodes.map((episode) => (
                    <tr key={`${episode.breachDate}-${episode.troughDate}`}>
                      <td>{episode.breachDate}</td>
                      <td>{episode.troughDate}</td>
                      <td className="ddNegative">{episode.lowReached.toFixed(2)}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="ddNoData">
                      {hasLoaded
                        ? "No drawdowns below 20% in the selected range"
                        : "No data loaded yet"}
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

export default Drawdowns;