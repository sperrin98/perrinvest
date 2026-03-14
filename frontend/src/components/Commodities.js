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
import "./Commodities.css";

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

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

export default function Commodities() {
  const [commodities, setCommodities] = useState([]);
  const [commodityData, setCommodityData] = useState([]);
  const [selectedCommodityName, setSelectedCommodityName] = useState("");
  const [selectedCommodityId, setSelectedCommodityId] = useState(null);
  const [error, setError] = useState("");
  const [timeframe, setTimeframe] = useState("ALL");
  const [startDate, setStartDate] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    async function fetchCommodities() {
      try {
        const response = await axios.get(`${API_URL}/commodities`);
        setCommodities(response.data);

        if (response.data.length > 0) {
          const first = response.data[0];
          fetchCommodityData(first.security_id, first.security_long_name);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load commodities.");
      }
    }

    fetchCommodities();
  }, [API_URL]);

  const fetchCommodityData = async (security_id, security_name) => {
    setSelectedCommodityId(security_id);
    setSelectedCommodityName(security_name);
    setCommodityData([]);
    setError("");
    setStartDate(null);
    setTimeframe("ALL");

    try {
      const response = await axios.get(`${API_URL}/commodities/${security_id}`);
      const data = response.data;

      if (!data || data.length === 0) {
        setError("This commodity has no price data.");
      } else {
        const sorted = [...data].sort(
          (a, b) => new Date(a.price_date) - new Date(b.price_date)
        );
        setCommodityData(sorted);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch commodity data.");
    }
  };

  const minDate = useMemo(() => {
    if (!commodityData.length) return null;
    return new Date(commodityData[0].price_date);
  }, [commodityData]);

  const maxDate = useMemo(() => {
    if (!commodityData.length) return null;
    return new Date(commodityData[commodityData.length - 1].price_date);
  }, [commodityData]);

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

  const filteredData = useMemo(() => {
    if (!commodityData || commodityData.length === 0) return [];

    let filtered = [...commodityData];

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
  }, [commodityData, timeframe, startDate]);

  return (
    <div className="cm-container">
      <aside className="cm-sidebar">
        <div className="cm-miniRail" aria-label="Timeframe selector">
          <button
            className={`cm-chip ${timeframe === "D" ? "cm-chip-active" : ""}`}
            onClick={() => handleTimeframeChange("D")}
            type="button"
            title="Daily (1Y)"
          >
            D
          </button>
          <button
            className={`cm-chip ${timeframe === "W" ? "cm-chip-active" : ""}`}
            onClick={() => handleTimeframeChange("W")}
            type="button"
            title="Weekly (5Y)"
          >
            W
          </button>
          <button
            className={`cm-chip ${timeframe === "M" ? "cm-chip-active" : ""}`}
            onClick={() => handleTimeframeChange("M")}
            type="button"
            title="Monthly (10Y)"
          >
            M
          </button>
          <button
            className={`cm-chip ${timeframe === "Q" ? "cm-chip-active" : ""}`}
            onClick={() => handleTimeframeChange("Q")}
            type="button"
            title="Quarterly (Inception)"
          >
            Q
          </button>
          <button
            className={`cm-chip ${timeframe === "ALL" ? "cm-chip-active" : ""}`}
            onClick={() => handleTimeframeChange("ALL")}
            type="button"
            title="All data (Inception)"
          >
            ALL
          </button>
        </div>

        <div className="cm-sidebarScroll">
          <div className="cm-date-section">
            <h2 className="cm-sidebar-title">Start Date</h2>

            <label className="cm-date-label">Pick Start Date</label>

            <div className="cm-datepicker-shell">
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
                className="cm-date-picker"
                wrapperClassName="cm-date-picker-wrapper"
                calendarClassName="cm-datepicker-calendar"
                popperClassName="cm-datepicker-popper"
              />
            </div>

            <button
              className="cm-reset-button"
              type="button"
              onClick={() => {
                setTimeframe("ALL");
                setStartDate(null);
              }}
            >
              Reset
            </button>
          </div>

          <h2 className="cm-sidebar-title">Select Commodity</h2>
          <ul className="cm-commodity-list">
            {commodities.map((com) => (
              <li
                key={com.security_id}
                className={`cm-commodity-item ${
                  selectedCommodityId === com.security_id
                    ? "cm-selected-commodity"
                    : ""
                }`}
                onClick={() =>
                  fetchCommodityData(com.security_id, com.security_long_name)
                }
              >
                {com.security_long_name}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="cm-main">
        {error && <p className="cm-error">{error}</p>}

        {selectedCommodityName && filteredData.length > 0 && (
          <>
            <h1 className="cm-title">{selectedCommodityName}</h1>
            <div className="cm-chart-wrapper">
              <ResponsiveContainer width="100%" height="90%">
                <LineChart
                  data={filteredData}
                  margin={{ top: 20, right: 50, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="price_date" tickFormatter={formatDate} />
                  <YAxis
                    yAxisId="left"
                    label={{ value: "Price", angle: -90, position: "insideLeft" }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{ value: "Price in Gold", angle: 90, position: "insideRight" }}
                  />
                  <Tooltip labelFormatter={formatDate} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="price"
                    stroke="#FF4C4C"
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

        {selectedCommodityName &&
          !error &&
          commodityData.length > 0 &&
          filteredData.length === 0 && (
            <>
              <h1 className="cm-title">{selectedCommodityName}</h1>
              <div className="cm-chart-wrapper">
                <div className="cm-emptyChart">No data for this date range.</div>
              </div>
            </>
          )}
      </div>
    </div>
  );
}