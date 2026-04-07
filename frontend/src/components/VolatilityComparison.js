// VolatilityComparison.js

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./VolatilityComparison.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
);

const API_URL = process.env.REACT_APP_API_URL;

const formatDateYYYYMMDD = (dateStr) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toISOString().split("T")[0];
};

const RANGE_PRESETS = ["1Y", "3Y", "5Y", "10Y", "MAX"];

const shiftYears = (dateString, years) => {
  const date = new Date(dateString);
  const shifted = new Date(date);
  shifted.setFullYear(shifted.getFullYear() - years);
  return shifted.toISOString().split("T")[0];
};

const clampStartDate = (start, minDate, maxDate) => {
  if (!start) return minDate;
  if (start < minDate) return minDate;
  if (start > maxDate) return minDate;
  return start;
};

const getPresetStartDate = (preset, maxDate, minDate) => {
  if (!maxDate || !minDate) return "";
  if (preset === "MAX") return minDate;

  const yearsMap = {
    "1Y": 1,
    "3Y": 3,
    "5Y": 5,
    "10Y": 10,
  };

  const years = yearsMap[preset];
  if (!years) return minDate;

  const shifted = shiftYears(maxDate, years);
  return clampStartDate(shifted, minDate, maxDate);
};

const securityLabel = (s) => {
  if (!s) return "";
  return s.security_long_name || s.name || "";
};

const percentileRank = (values, currentValue) => {
  if (!values.length || !Number.isFinite(currentValue)) return null;
  const count = values.filter((v) => v <= currentValue).length;
  return (count / values.length) * 100;
};

const formatPercentile = (value) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return `${value.toFixed(1)}%`;
};

function SecurityDropdown({
  label,
  query,
  setQuery,
  open,
  setOpen,
  refProp,
  items,
  onPick,
}) {
  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const name = (item.security_long_name || item.name || "").toLowerCase();
      const ticker = (item.ticker || "").toLowerCase();
      return name.includes(q) || ticker.includes(q);
    });
  }, [items, query]);

  return (
    <div className="vcomp-control" ref={refProp}>
      <label>{label}</label>
      <div className="vcomp-dd-inputWrap">
        <input
          className="vcomp-input vcomp-dd-input"
          value={query}
          placeholder="Select / type to search…"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={(e) => {
            e.target.select();
            setOpen(true);
          }}
          onClick={(e) => {
            e.target.select();
            setOpen(true);
          }}
        />
        <button
          type="button"
          className="vcomp-dd-toggle"
          onClick={() => setOpen((p) => !p)}
        >
          ▾
        </button>
      </div>

      {open && (
        <div className="vcomp-dd">
          {filtered.length === 0 ? (
            <div className="vcomp-dd-empty">No matches</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.security_id}
                className="vcomp-dd-item"
                type="button"
                onClick={() => onPick(item)}
              >
                <div className="vcomp-dd-main">
                  {item.security_long_name || item.name}
                </div>
                {item.ticker ? <div className="vcomp-dd-sub">{item.ticker}</div> : null}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function VolatilityComparison() {
  const [securities, setSecurities] = useState([]);
  const [loadingSecurities, setLoadingSecurities] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState("");

  const [sec1, setSec1] = useState(null);
  const [sec2, setSec2] = useState(null);
  const [sec3, setSec3] = useState(null);
  const [sec4, setSec4] = useState(null);

  const [sec1Query, setSec1Query] = useState("");
  const [sec2Query, setSec2Query] = useState("");
  const [sec3Query, setSec3Query] = useState("");
  const [sec4Query, setSec4Query] = useState("");

  const [sec1Open, setSec1Open] = useState(false);
  const [sec2Open, setSec2Open] = useState(false);
  const [sec3Open, setSec3Open] = useState(false);
  const [sec4Open, setSec4Open] = useState(false);

  const [rows, setRows] = useState([]);

  const [selectedRangePreset, setSelectedRangePreset] = useState("MAX");
  const [customStartDate, setCustomStartDate] = useState("2010-01-01");
  const [customEndDate, setCustomEndDate] = useState("");
  const [activeStartDate, setActiveStartDate] = useState("");
  const [activeEndDate, setActiveEndDate] = useState("");

  const sec1Ref = useRef(null);
  const sec2Ref = useRef(null);
  const sec3Ref = useRef(null);
  const sec4Ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (sec1Ref.current && !sec1Ref.current.contains(e.target)) setSec1Open(false);
      if (sec2Ref.current && !sec2Ref.current.contains(e.target)) setSec2Open(false);
      if (sec3Ref.current && !sec3Ref.current.contains(e.target)) setSec3Open(false);
      if (sec4Ref.current && !sec4Ref.current.contains(e.target)) setSec4Open(false);
    };

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const fetchSecurities = async () => {
      try {
        setLoadingSecurities(true);
        setError("");

        const response = await axios.get(`${API_URL}/securities`);
        const list = Array.isArray(response.data) ? response.data : [];
        setSecurities(list);
      } catch (err) {
        console.error(err);
        setError("Failed to load securities.");
      } finally {
        setLoadingSecurities(false);
      }
    };

    fetchSecurities();
  }, []);

  const fetchComparison = async (startDateToUse) => {
    if (!sec1 || !sec2 || !sec3 || !sec4) return;

    try {
      setLoadingChart(true);
      setError("");

      const response = await axios.get(`${API_URL}/volatility-comparison`, {
        params: {
          sec_id1: sec1.security_id,
          sec_id2: sec2.security_id,
          sec_id3: sec3.security_id,
          sec_id4: sec4.security_id,
          start_date: startDateToUse,
        },
      });

      const cleaned = (Array.isArray(response.data) ? response.data : [])
        .map((row) => ({
          price_date: formatDateYYYYMMDD(row.price_date),
          vol1: row.vol1 != null ? Number(row.vol1) : null,
          vol2: row.vol2 != null ? Number(row.vol2) : null,
          vol3: row.vol3 != null ? Number(row.vol3) : null,
          vol4: row.vol4 != null ? Number(row.vol4) : null,
        }))
        .filter((row) => row.price_date)
        .sort((a, b) => new Date(a.price_date) - new Date(b.price_date));

      setRows(cleaned);

      if (cleaned.length > 0) {
        const minDate = cleaned[0].price_date;
        const maxDate = cleaned[cleaned.length - 1].price_date;
        setSelectedRangePreset("MAX");
        setActiveStartDate(minDate);
        setActiveEndDate(maxDate);
        setCustomStartDate(minDate);
        setCustomEndDate(maxDate);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load volatility comparison.");
      setRows([]);
    } finally {
      setLoadingChart(false);
    }
  };

  const handleLoadComparison = () => {
    if (!sec1 || !sec2 || !sec3 || !sec4) {
      setError("Please select all 4 securities.");
      return;
    }

    fetchComparison(customStartDate || "2010-01-01");
  };

  const handlePresetRange = (preset) => {
    if (!rows.length) return;

    const minDate = rows[0].price_date;
    const maxDate = rows[rows.length - 1].price_date;
    const newStart = getPresetStartDate(preset, maxDate, minDate);

    setSelectedRangePreset(preset);
    setActiveStartDate(newStart);
    setActiveEndDate(maxDate);
    setCustomStartDate(newStart);
    setCustomEndDate(maxDate);
  };

  const handleApplyCustomRange = () => {
    if (!rows.length) return;

    const minDate = rows[0].price_date;
    const maxDate = rows[rows.length - 1].price_date;

    let start = customStartDate || minDate;
    let end = customEndDate || maxDate;

    if (start < minDate) start = minDate;
    if (end > maxDate) end = maxDate;

    if (start > end) {
      const temp = start;
      start = end;
      end = temp;
    }

    setSelectedRangePreset("");
    setActiveStartDate(start);
    setActiveEndDate(end);
    setCustomStartDate(start);
    setCustomEndDate(end);
  };

  const filteredRows = useMemo(() => {
    if (!rows.length || !activeStartDate || !activeEndDate) return [];
    return rows.filter(
      (row) => row.price_date >= activeStartDate && row.price_date <= activeEndDate
    );
  }, [rows, activeStartDate, activeEndDate]);

  const percentileCards = useMemo(() => {
    if (!filteredRows.length) return [];

    const seriesDefs = [
      { key: "vol1", security: sec1, cls: "vcomp-percentile-card-red" },
      { key: "vol2", security: sec2, cls: "vcomp-percentile-card-teal" },
      { key: "vol3", security: sec3, cls: "vcomp-percentile-card-blue" },
      { key: "vol4", security: sec4, cls: "vcomp-percentile-card-orange" },
    ];

    return seriesDefs.map(({ key, security, cls }) => {
      const values = filteredRows
        .map((row) => row[key])
        .filter((v) => Number.isFinite(v));

      const currentValue = values.length ? values[values.length - 1] : null;
      const percentile = percentileRank(values, currentValue);

      return {
        name: securityLabel(security) || "Unselected",
        currentValue,
        percentile,
        cls,
      };
    });
  }, [filteredRows, sec1, sec2, sec3, sec4]);

  const chartData = useMemo(() => {
    return {
      labels: filteredRows.map((row) => row.price_date),
      datasets: [
        {
          label: securityLabel(sec1),
          data: filteredRows.map((row) => row.vol1),
          borderColor: "#e84d4d",
          backgroundColor: "rgba(232, 77, 77, 0.08)",
          borderWidth: 1.2,
          pointRadius: 0,
          tension: 0.15,
          fill: false,
          spanGaps: true,
        },
        {
          label: securityLabel(sec2),
          data: filteredRows.map((row) => row.vol2),
          borderColor: "#0f766e",
          backgroundColor: "rgba(15, 118, 110, 0.08)",
          borderWidth: 1.2,
          pointRadius: 0,
          tension: 0.15,
          fill: false,
          spanGaps: true,
        },
        {
          label: securityLabel(sec3),
          data: filteredRows.map((row) => row.vol3),
          borderColor: "#1d4ed8",
          backgroundColor: "rgba(29, 78, 216, 0.08)",
          borderWidth: 1.2,
          pointRadius: 0,
          tension: 0.15,
          fill: false,
          spanGaps: true,
        },
        {
          label: securityLabel(sec4),
          data: filteredRows.map((row) => row.vol4),
          borderColor: "#d97706",
          backgroundColor: "rgba(217, 119, 6, 0.08)",
          borderWidth: 1.2,
          pointRadius: 0,
          tension: 0.15,
          fill: false,
          spanGaps: true,
        },
      ],
    };
  }, [filteredRows, sec1, sec2, sec3, sec4]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 220,
      easing: "linear",
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        labels: { color: "#00796b" },
      },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#123c36",
        bodyColor: "#123c36",
        borderColor: "rgba(15, 118, 110, 0.18)",
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      x: {
        title: { display: true, text: "Date", color: "#00796b" },
        ticks: { color: "#00796b", maxTicksLimit: 10 },
        grid: { color: "rgb(202, 202, 202)" },
      },
      y: {
        title: { display: true, text: "Volatility", color: "#00796b" },
        ticks: { color: "#00796b" },
        grid: { color: "rgb(202, 202, 202)" },
      },
    },
  };

  return (
    <div className="vcomp-page">
      <div className="vcomp-container">
        <aside className="vcomp-sidebar">
          <div className="vcomp-sidebar-top">
            <h2 className="vcomp-sidebar-title">Vol Comparison</h2>
            <div className="vcomp-sidebar-subtitle">
              Compare 4 securities on one volatility chart.
            </div>
          </div>

          {loadingSecurities ? <div className="vcomp-hint">Loading securities…</div> : null}
          {error ? <div className="vcomp-error">{error}</div> : null}

          <SecurityDropdown
            label="Security 1"
            query={sec1Query}
            setQuery={setSec1Query}
            open={sec1Open}
            setOpen={setSec1Open}
            refProp={sec1Ref}
            items={securities}
            onPick={(item) => {
              setSec1(item);
              setSec1Query(securityLabel(item));
              setSec1Open(false);
            }}
          />

          <SecurityDropdown
            label="Security 2"
            query={sec2Query}
            setQuery={setSec2Query}
            open={sec2Open}
            setOpen={setSec2Open}
            refProp={sec2Ref}
            items={securities}
            onPick={(item) => {
              setSec2(item);
              setSec2Query(securityLabel(item));
              setSec2Open(false);
            }}
          />

          <SecurityDropdown
            label="Security 3"
            query={sec3Query}
            setQuery={setSec3Query}
            open={sec3Open}
            setOpen={setSec3Open}
            refProp={sec3Ref}
            items={securities}
            onPick={(item) => {
              setSec3(item);
              setSec3Query(securityLabel(item));
              setSec3Open(false);
            }}
          />

          <SecurityDropdown
            label="Security 4"
            query={sec4Query}
            setQuery={setSec4Query}
            open={sec4Open}
            setOpen={setSec4Open}
            refProp={sec4Ref}
            items={securities}
            onPick={(item) => {
              setSec4(item);
              setSec4Query(securityLabel(item));
              setSec4Open(false);
            }}
          />

          <button className="vcomp-load-btn" onClick={handleLoadComparison} type="button">
            Load Comparison
          </button>
        </aside>

        <div className="vcomp-main">
          <h1 className="vcomp-title">Volatility Comparison</h1>

          <div className="vcomp-toolbar">
            <div className="vcomp-range-presets">
              {RANGE_PRESETS.map((range) => (
                <button
                  key={range}
                  className={`vcomp-range-btn ${selectedRangePreset === range ? "selected" : ""}`}
                  onClick={() => handlePresetRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>

            <div className="vcomp-custom-date-controls">
              <div className="vcomp-date-input-group">
                <label htmlFor="vcomp-start-date">Start</label>
                <input
                  id="vcomp-start-date"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>

              <div className="vcomp-date-input-group">
                <label htmlFor="vcomp-end-date">End</label>
                <input
                  id="vcomp-end-date"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>

              <button className="vcomp-apply-range-btn" onClick={handleApplyCustomRange}>
                Apply
              </button>
            </div>
          </div>

          {percentileCards.length > 0 && (
            <div className="vcomp-percentile-grid">
              {percentileCards.map((card) => (
                <div key={card.name} className={`vcomp-percentile-card ${card.cls}`}>
                  <div className="vcomp-percentile-name">{card.name}</div>
                  <div className="vcomp-percentile-label">Current Vol Percentile</div>
                  <div className="vcomp-percentile-value">
                    {formatPercentile(card.percentile)}
                  </div>
                  <div className="vcomp-percentile-sub">
                    Current Vol: {card.currentValue !== null && Number.isFinite(card.currentValue)
                      ? card.currentValue.toFixed(4)
                      : "-"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {loadingChart ? (
            <div className="vcomp-empty-state">
              <p>Loading chart...</p>
            </div>
          ) : filteredRows.length > 0 ? (
            <div className="vcomp-chart-card">
              <div className="vcomp-chart-canvas">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          ) : (
            <div className="vcomp-empty-state">
              <p>Select four securities and load the comparison.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VolatilityComparison;