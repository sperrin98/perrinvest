import React, { useState, useEffect, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import "./EquityMarkets.css";

const toISODate = (d) => new Date(d).toISOString().split("T")[0];

const addYears = (date, years) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

const startOfWeekMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = (date) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfQuarter = (date) => {
  const d = new Date(date);
  const q = Math.floor(d.getMonth() / 3);
  d.setMonth(q * 3, 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const aggregateSeries = (rows, mode, valueKey) => {
  const map = new Map();

  for (const r of rows) {
    const dt = new Date(r.price_date);
    let keyDate;

    if (mode === "W") keyDate = startOfWeekMonday(dt);
    else if (mode === "M") keyDate = startOfMonth(dt);
    else if (mode === "Q") keyDate = startOfQuarter(dt);
    else keyDate = dt;

    const key = toISODate(keyDate);

    map.set(key, {
      price_date: key,
      [valueKey]: r[valueKey],
    });
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.price_date) - new Date(b.price_date)
  );
};

export default function EquityMarkets() {
  const [securities, setSecurities] = useState([]);
  const [equityData, setEquityData] = useState([]);
  const [selectedSecurityName, setSelectedSecurityName] = useState("");
  const [selectedSecurityId, setSelectedSecurityId] = useState(null);
  const [error, setError] = useState("");
  const [timeframe, setTimeframe] = useState("ALL");
  const [startDate, setStartDate] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    async function fetchSecurities() {
      try {
        const response = await axios.get(`${API_URL}/equity-markets`);
        setSecurities(response.data);

        if (response.data.length > 0) {
          const first = response.data[0];
          setSelectedSecurityName(first.security_long_name);
          setSelectedSecurityId(first.security_id);
          fetchEquityData(first.security_id, first.security_long_name);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load securities.");
      }
    }

    fetchSecurities();
  }, [API_URL]);

  const fetchEquityData = async (security_id, security_name) => {
    setSelectedSecurityName(security_name);
    setSelectedSecurityId(security_id);
    setEquityData([]);
    setError("");
    setStartDate(null);
    setTimeframe("ALL");

    try {
      const response = await axios.get(`${API_URL}/equity-markets/${security_id}`);
      const data = response.data;

      if (!data || data.length === 0) {
        setError("This security has no equity market data.");
      } else {
        const sorted = [...data].sort(
          (a, b) => new Date(a.price_date) - new Date(b.price_date)
        );
        setEquityData(sorted);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch equity data.");
    }
  };

  const minDate = useMemo(() => {
    if (!equityData.length) return null;
    return new Date(equityData[0].price_date);
  }, [equityData]);

  const maxDate = useMemo(() => {
    if (!equityData.length) return null;
    return new Date(equityData[equityData.length - 1].price_date);
  }, [equityData]);

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);

    if (!maxDate) {
      setStartDate(null);
      return;
    }

    if (newTimeframe === "D") {
      setStartDate(addYears(maxDate, -1));
      return;
    }

    if (newTimeframe === "W") {
      setStartDate(addYears(maxDate, -5));
      return;
    }

    if (newTimeframe === "M") {
      setStartDate(addYears(maxDate, -10));
      return;
    }

    if (newTimeframe === "Q" || newTimeframe === "ALL") {
      setStartDate(null);
    }
  };

  const displayedEquityData = useMemo(() => {
    if (!equityData || equityData.length === 0) return [];

    let filtered = [...equityData];

    if (startDate) {
      const selected = new Date(startDate);
      selected.setHours(0, 0, 0, 0);

      filtered = filtered.filter((r) => {
        const d = new Date(r.price_date);
        d.setHours(0, 0, 0, 0);
        return d >= selected;
      });
    }

    if (timeframe === "D" || timeframe === "ALL") return filtered;

    const priceSeries = aggregateSeries(filtered, timeframe, "price");
    const goldSeries = aggregateSeries(filtered, timeframe, "price_in_gold");

    const goldMap = new Map(
      goldSeries.map((row) => [row.price_date, row.price_in_gold])
    );

    return priceSeries.map((row) => ({
      price_date: row.price_date,
      price: row.price,
      price_in_gold: goldMap.get(row.price_date),
    }));
  }, [equityData, timeframe, startDate]);

  return (
    <div className="em-container">
      <aside className="em-sidebar">
        <div className="em-miniRail" aria-label="Timeframe selector">
          <button
            className={`em-chip ${timeframe === "D" ? "em-chip-active" : ""}`}
            onClick={() => handleTimeframeChange("D")}
            type="button"
            title="Daily (1Y)"
          >
            D
          </button>
          <button
            className={`em-chip ${timeframe === "W" ? "em-chip-active" : ""}`}
            onClick={() => handleTimeframeChange("W")}
            type="button"
            title="Weekly (5Y)"
          >
            W
          </button>
          <button
            className={`em-chip ${timeframe === "M" ? "em-chip-active" : ""}`}
            onClick={() => handleTimeframeChange("M")}
            type="button"
            title="Monthly (10Y)"
          >
            M
          </button>
          <button
            className={`em-chip ${timeframe === "Q" ? "em-chip-active" : ""}`}
            onClick={() => handleTimeframeChange("Q")}
            type="button"
            title="Quarterly (Inception)"
          >
            Q
          </button>
          <button
            className={`em-chip ${timeframe === "ALL" ? "em-chip-active" : ""}`}
            onClick={() => handleTimeframeChange("ALL")}
            type="button"
            title="All data (Inception)"
          >
            ALL
          </button>
        </div>

        <div className="em-sidebarScroll">
          <div className="em-date-section">
            <h2 className="em-sidebar-title">Start Date</h2>

            <label className="em-date-label">Pick Start Date</label>

            <div className="em-datepicker-shell">
              <DatePicker
                selected={startDate}
                onChange={(date) => {
                  setStartDate(date);
                  if (date) {
                    setTimeframe("ALL");
                  }
                }}
                minDate={minDate}
                maxDate={maxDate}
                dateFormat="dd/MM/yyyy"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                isClearable
                placeholderText="Select a start date"
                className="em-date-picker"
                wrapperClassName="em-date-picker-wrapper"
                calendarClassName="em-datepicker-calendar"
                popperClassName="em-datepicker-popper"
              />
            </div>

            <button
              className="em-reset-button"
              type="button"
              onClick={() => {
                setTimeframe("ALL");
                setStartDate(null);
              }}
            >
              Reset
            </button>
          </div>

          <h2 className="em-sidebar-title">Select Equity Market</h2>
          <ul className="em-security-list">
            {securities.map((sec) => (
              <li
                key={sec.security_id}
                className={`em-security-item ${
                  selectedSecurityId === sec.security_id
                    ? "em-selected-security"
                    : ""
                }`}
                onClick={() => fetchEquityData(sec.security_id, sec.security_long_name)}
              >
                {sec.security_long_name}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="em-main">
        {error && <p className="em-error">{error}</p>}

        {selectedSecurityName && displayedEquityData.length > 0 && (
          <>
            <h1 className="em-title">{selectedSecurityName}</h1>
            <div className="em-chart-wrapper">
              <ResponsiveContainer width="100%" height="90%">
                <LineChart
                  data={displayedEquityData}
                  margin={{ top: 20, right: 50, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="price_date" />
                  <YAxis
                    yAxisId="left"
                    label={{ value: "Price", angle: -90, position: "insideLeft" }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{ value: "Price in Gold", angle: 90, position: "insideRight" }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="price"
                    stroke="#8884d8"
                    dot={false}
                    name={`Price (${timeframe})`}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="price_in_gold"
                    stroke="#00796b"
                    dot={false}
                    name={`Price in Gold (${timeframe})`}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {selectedSecurityName &&
          !error &&
          equityData.length > 0 &&
          displayedEquityData.length === 0 && (
            <>
              <h1 className="em-title">{selectedSecurityName}</h1>
              <div className="em-chart-wrapper">
                <div className="em-emptyChart">No data for this date range.</div>
              </div>
            </>
          )}
      </div>
    </div>
  );
}