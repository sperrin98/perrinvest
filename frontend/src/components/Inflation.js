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
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./Inflation.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
  Filler
);

const API_URL = process.env.REACT_APP_API_URL;
const RANGE_PRESETS = ["1Y", "3Y", "5Y", "10Y", "25Y", "50Y", "100Y", "150Y", "MAX"];

const ECO_POINTS = [
  { eco_data_point_id: 19, eco_data_point_name: "US Inflation" },
  { eco_data_point_id: 20, eco_data_point_name: "UK Inflation" },
];

const formatDateYYYYMMDD = (dateStr) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toISOString().split("T")[0];
};

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
    "25Y": 25,
    "50Y": 50,
    "100Y": 100,
    "150Y": 150,
  };

  const years = yearsMap[preset];
  if (!years) return minDate;

  const shifted = shiftYears(maxDate, years);
  return clampStartDate(shifted, minDate, maxDate);
};

const percentileRank = (values, currentValue) => {
  if (!values.length || !Number.isFinite(currentValue)) return null;

  const count = values.filter((value) => value <= currentValue).length;
  return (count / values.length) * 100;
};

const formatValue = (value, decimals = 2) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }

  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatPercentile = (value) => {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "-";
  }

  return `${value.toFixed(1)}%`;
};

function Inflation() {
  const [selectedPoint, setSelectedPoint] = useState(ECO_POINTS[1]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  const [selectedRangePreset, setSelectedRangePreset] = useState("MAX");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [activeStartDate, setActiveStartDate] = useState("");
  const [activeEndDate, setActiveEndDate] = useState("");

  const chartScrollRef = useRef(null);

  const fetchInflationAnalysis = async (ecoDataPointId, startDateToUse = "") => {
    try {
      setLoadingChart(true);
      setError("");

      const params = {
        eco_data_point_id: ecoDataPointId,
      };

      if (startDateToUse) {
        params.start_date = startDateToUse;
      }

      const response = await axios.get(`${API_URL}/inflation-analysis`, {
        params,
      });

      const raw = Array.isArray(response.data) ? response.data : [];

      const cleaned = raw
        .map((row) => ({
          price_date: formatDateYYYYMMDD(row.price_date),
          inflation_rate:
            row.inflation_rate != null ? Number(row.inflation_rate) : null,
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
      } else {
        setActiveStartDate("");
        setActiveEndDate("");
        setCustomStartDate("");
        setCustomEndDate("");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load inflation analysis.");
      setRows([]);
      setActiveStartDate("");
      setActiveEndDate("");
      setCustomStartDate("");
      setCustomEndDate("");
    } finally {
      setLoadingChart(false);
    }
  };

  useEffect(() => {
    if (selectedPoint?.eco_data_point_id) {
      fetchInflationAnalysis(selectedPoint.eco_data_point_id, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoint]);

  const effectiveRangeBounds = useMemo(() => {
    if (!rows.length) {
      return {
        minDate: "",
        maxDate: "",
      };
    }

    return {
      minDate: rows[0].price_date,
      maxDate: rows[rows.length - 1].price_date,
    };
  }, [rows]);

  useEffect(() => {
    if (!rows.length) return;

    const { minDate, maxDate } = effectiveRangeBounds;
    if (!minDate || !maxDate) return;

    setSelectedRangePreset("MAX");
    setActiveStartDate(minDate);
    setActiveEndDate(maxDate);
    setCustomStartDate(minDate);
    setCustomEndDate(maxDate);
  }, [rows, effectiveRangeBounds]);

  const handlePresetRange = (preset) => {
    const { minDate, maxDate } = effectiveRangeBounds;
    if (!minDate || !maxDate) return;

    const newStart = getPresetStartDate(preset, maxDate, minDate);

    setSelectedRangePreset(preset);
    setActiveStartDate(newStart);
    setActiveEndDate(maxDate);
    setCustomStartDate(newStart);
    setCustomEndDate(maxDate);
  };

  const handleApplyCustomRange = () => {
    const { minDate, maxDate } = effectiveRangeBounds;
    if (!minDate || !maxDate) return;

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

    return rows.filter((row) => {
      const inRange =
        row.price_date >= activeStartDate && row.price_date <= activeEndDate;
      const hasValue = Number.isFinite(row.inflation_rate);

      return inRange && hasValue;
    });
  }, [rows, activeStartDate, activeEndDate]);

  useEffect(() => {
    if (!chartScrollRef.current) return;
    if (window.innerWidth > 650) return;
    if (!filteredRows.length) return;

    const scrollToEnd = () => {
      if (!chartScrollRef.current) return;

      chartScrollRef.current.scrollLeft =
        chartScrollRef.current.scrollWidth - chartScrollRef.current.clientWidth;
    };

    requestAnimationFrame(() => {
      scrollToEnd();
      setTimeout(scrollToEnd, 50);
      setTimeout(scrollToEnd, 150);
      setTimeout(scrollToEnd, 300);
    });
  }, [
    filteredRows.length,
    selectedRangePreset,
    activeStartDate,
    activeEndDate,
    selectedPoint,
  ]);

  const currentValues = useMemo(() => {
    if (!filteredRows.length) return null;

    const values = filteredRows
      .map((row) => row.inflation_rate)
      .filter((value) => Number.isFinite(value));

    if (!values.length) return null;

    const currentValue = values[values.length - 1];
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const percentile = percentileRank(values, currentValue);

    return {
      currentValue,
      maxValue,
      minValue,
      percentile,
    };
  }, [filteredRows]);

  const chartData = useMemo(() => {
    return {
      labels: filteredRows.map((row) => row.price_date),
      datasets: [
        {
          label: "Inflation Rate",
          data: filteredRows.map((row) => row.inflation_rate),
          borderColor: "#e84d4d",
          backgroundColor: "rgba(232, 77, 77, 0.08)",
          borderWidth: 1.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHitRadius: 10,
          tension: 0.15,
          fill: true,
          spanGaps: true,
        },
      ],
    };
  }, [filteredRows]);

  const chartOptions = useMemo(() => {
    return {
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
          labels: {
            color: "#00796b",
            usePointStyle: true,
            pointStyle: "line",
            boxWidth: 30,
            boxHeight: 8,
            padding: 14,
            font: {
              size: 12,
              weight: "600",
            },
          },
        },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#123c36",
          bodyColor: "#123c36",
          borderColor: "rgba(15, 118, 110, 0.18)",
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (context) => {
              const value = context.raw;

              if (value === null || value === undefined) {
                return "Inflation Rate: -";
              }

              return `Inflation Rate: ${Number(value).toFixed(4)}`;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Date",
            color: "#00796b",
          },
          ticks: {
            color: "#00796b",
            maxTicksLimit: 10,
            maxRotation: 0,
            minRotation: 0,
          },
          grid: {
            color: "rgba(0, 0, 0, 0.08)",
          },
        },
        y: {
          title: {
            display: true,
            text: "Inflation Rate",
            color: "#00796b",
          },
          ticks: {
            color: "#00796b",
          },
          grid: {
            color: "rgba(0, 0, 0, 0.08)",
          },
        },
      },
    };
  }, []);

  return (
    <div className="inflation-container">
      <aside className="inflation-sidebar">
        <div className="inflation-miniRail" aria-label="Range selector">
          {RANGE_PRESETS.map((range) => (
            <button
              key={range}
              type="button"
              className={`inflation-chip ${
                selectedRangePreset === range ? "inflation-chip-active" : ""
              }`}
              onClick={() => handlePresetRange(range)}
              title={range}
            >
              {range}
            </button>
          ))}
        </div>

        <div className="inflation-sidebarScroll inflation-desktop-sidebarScroll">
          <div className="inflation-sidebar-top">
            <h2 className="inflation-sidebar-title">Inflation</h2>
            <div className="inflation-sidebar-subtitle">
              Inflation data over time.
            </div>
          </div>

          <div className="inflation-sidebar-section">
            <h3 className="inflation-sidebar-subtitle inflation-sidebar-subtitle-spaced">
              Country
            </h3>

            <div className="inflation-country-buttons">
              {ECO_POINTS.map((point) => (
                <button
                  key={point.eco_data_point_id}
                  type="button"
                  className={`inflation-series-btn ${
                    selectedPoint.eco_data_point_id === point.eco_data_point_id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => setSelectedPoint(point)}
                >
                  {point.eco_data_point_name}
                </button>
              ))}
            </div>
          </div>

          <div className="inflation-sidebar-section">
            <h3 className="inflation-sidebar-subtitle inflation-sidebar-subtitle-spaced">
              Custom Range
            </h3>

            <div className="inflation-date-control">
              <label htmlFor="inflation-start-date-desktop">Start</label>
              <input
                id="inflation-start-date-desktop"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>

            <div className="inflation-date-control">
              <label htmlFor="inflation-end-date-desktop">End</label>
              <input
                id="inflation-end-date-desktop"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="inflation-apply-range-btn"
              onClick={handleApplyCustomRange}
            >
              Apply Range
            </button>
          </div>

          {error ? <div className="inflation-error-box">{error}</div> : null}
        </div>

        <div className="inflation-mobile-controls">
          <div className="inflation-mobile-card">
            <div className="inflation-mobile-section">
              <div className="inflation-mobile-label">Country</div>

              <select
                className="inflation-mobile-select"
                value={selectedPoint.eco_data_point_id}
                onChange={(e) => {
                  const nextPoint = ECO_POINTS.find(
                    (point) =>
                      String(point.eco_data_point_id) === String(e.target.value)
                  );

                  if (nextPoint) {
                    setSelectedPoint(nextPoint);
                  }
                }}
              >
                {ECO_POINTS.map((point) => (
                  <option
                    key={point.eco_data_point_id}
                    value={point.eco_data_point_id}
                  >
                    {point.eco_data_point_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="inflation-mobile-section">
              <div className="inflation-mobile-label">Range</div>

              <div className="inflation-mobile-range-bar">
                {RANGE_PRESETS.map((range) => (
                  <button
                    key={range}
                    type="button"
                    className={`inflation-mobile-chip ${
                      selectedRangePreset === range
                        ? "inflation-mobile-chip-active"
                        : ""
                    }`}
                    onClick={() => handlePresetRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="inflation-mobile-grid">
              <div className="inflation-mobile-section">
                <div className="inflation-mobile-label">Start</div>
                <input
                  type="date"
                  className="inflation-mobile-input"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>

              <div className="inflation-mobile-section">
                <div className="inflation-mobile-label">End</div>
                <input
                  type="date"
                  className="inflation-mobile-input"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              className="inflation-mobile-apply"
              onClick={handleApplyCustomRange}
            >
              Apply Range
            </button>

            {error ? <div className="inflation-mobile-error">{error}</div> : null}
          </div>
        </div>
      </aside>

      <main className="inflation-main">
        <h1 className="inflation-title">
          {selectedPoint?.eco_data_point_name || "Inflation"}
        </h1>

        {currentValues && (
          <div className="inflation-stats-row">
            <div className="inflation-stat-card">
              <span className="inflation-stat-label">Current Value</span>
              <span className="inflation-stat-value">
                {formatValue(currentValues.currentValue, 4)}
              </span>
            </div>

            <div className="inflation-stat-card">
              <span className="inflation-stat-label">Peak Value</span>
              <span className="inflation-stat-value">
                {formatValue(currentValues.maxValue, 4)}
              </span>
            </div>

            <div className="inflation-stat-card">
              <span className="inflation-stat-label">Low Value</span>
              <span className="inflation-stat-value">
                {formatValue(currentValues.minValue, 4)}
              </span>
            </div>

            <div className="inflation-stat-card">
              <span className="inflation-stat-label">Current Percentile</span>
              <span className="inflation-stat-value">
                {formatPercentile(currentValues.percentile)}
              </span>
            </div>
          </div>
        )}

        {loadingChart ? (
          <div className="inflation-empty-state">
            <p>Loading chart...</p>
          </div>
        ) : filteredRows.length > 0 ? (
          <section className="inflation-chart-card">
            <div className="inflation-chart-header">
              <div>
                <div className="inflation-chart-kicker">Inflation</div>
                <div className="inflation-chart-name">
                  {selectedPoint?.eco_data_point_name}
                </div>
              </div>
            </div>

            <div className="inflation-chart-scroll-hint">
              Swipe sideways to view the full chart
            </div>

            <div className="inflation-chart-scroll-area" ref={chartScrollRef}>
              <div className="inflation-chart-canvas">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          </section>
        ) : (
          <div className="inflation-empty-state">
            <p>No data available for this inflation series.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Inflation;