import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import annotationPlugin from "chartjs-plugin-annotation";
import "./EcoDataPoints.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin,
  annotationPlugin
);

const NW_HPI_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
const RANGE_PRESETS = ["1Y", "3Y", "5Y", "10Y", "MAX"];

const EVENT_MARKERS = [
  { id: "nixon", label: "1971 Nixon Shock", date: "1971-08-15" },
  { id: "blackmonday", label: "1987 Crash", date: "1987-10-19" },
  { id: "dotcom", label: "2000 Dot-Com Peak", date: "2000-03-10" },
  { id: "gfc", label: "2008 GFC", date: "2008-09-15" },
  { id: "covid", label: "2020 Covid Crash", date: "2020-03-16" },
  { id: "inflation", label: "2022 Inflation Shock", date: "2022-06-13" },
];

const MACRO_REGIMES = [
  { id: "qe1", label: "QE1", start: "2008-11-25", end: "2010-03-31", type: "qe" },
  { id: "qe2", label: "QE2", start: "2010-11-03", end: "2011-06-30", type: "qe" },
  { id: "qe3", label: "QE3", start: "2012-09-13", end: "2014-10-29", type: "qe" },
  { id: "qe_pandemic", label: "Pandemic QE", start: "2020-03-15", end: "2022-03-15", type: "qe" },
  { id: "hike_1994", label: "Rate Hike Cycle", start: "1994-02-04", end: "1995-02-01", type: "hike" },
  { id: "hike_1999", label: "Rate Hike Cycle", start: "1999-06-30", end: "2000-05-16", type: "hike" },
  { id: "hike_2004", label: "Rate Hike Cycle", start: "2004-06-30", end: "2006-08-08", type: "hike" },
  { id: "hike_2015", label: "Rate Hike Cycle", start: "2015-12-16", end: "2018-12-19", type: "hike" },
  { id: "hike_2022", label: "Rate Hike Cycle", start: "2022-03-16", end: "2023-07-26", type: "hike" },
];

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const pickValue = (row, candidates) => {
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      const parsed = parseNumber(row[key]);
      if (parsed !== null) return parsed;
    }
  }
  return null;
};

const normaliseHpiSeries = (rows) => {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => ({
      price_date: row.price_date,
      HPI_index_nominal: pickValue(row, [
        "HPI_index",
        "hpi_index",
        "nominal_HPI_index",
        "HPI_index_nominal",
      ]),
      HPI_gold_index_nominal: pickValue(row, [
        "HPI_gold_index",
        "hpi_gold_index",
        "nominal_HPI_gold_index",
        "HPI_gold_index_nominal",
      ]),
      HPI_index_real: pickValue(row, [
        "HPI_index_real",
        "real_HPI_index",
        "real_hpi_index",
        "inflation_adjusted_HPI_index",
        "HPI_real_index",
      ]),
      HPI_gold_index_real: pickValue(row, [
        "HPI_gold_index_real",
        "real_HPI_gold_index",
        "real_hpi_gold_index",
        "inflation_adjusted_HPI_gold_index",
        "HPI_gold_real_index",
      ]),
    }))
    .filter((row) => row.price_date)
    .sort((a, b) => new Date(a.price_date) - new Date(b.price_date));
};

const shiftYears = (dateString, years) => {
  const date = new Date(dateString);
  const shifted = new Date(date);
  shifted.setFullYear(shifted.getFullYear() - years);
  return shifted.toISOString().split("T")[0];
};

const clampDate = (date, minDate, maxDate) => {
  if (!date) return minDate;
  if (date < minDate) return minDate;
  if (date > maxDate) return maxDate;
  return date;
};

const getPresetStartDate = (preset, maxDate, minDate) => {
  if (preset === "MAX") return minDate;
  const map = { "1Y": 1, "3Y": 3, "5Y": 5, "10Y": 10 };
  const years = map[preset];
  if (!years) return minDate;
  return clampDate(shiftYears(maxDate, years), minDate, maxDate);
};

const findNearestVisibleDate = (targetDate, visibleDates) => {
  if (!visibleDates.length) return null;

  const target = new Date(targetDate).getTime();
  let nearest = visibleDates[0];
  let minDiff = Math.abs(new Date(visibleDates[0]).getTime() - target);

  for (let i = 1; i < visibleDates.length; i += 1) {
    const diff = Math.abs(new Date(visibleDates[i]).getTime() - target);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = visibleDates[i];
    }
  }

  return nearest;
};

const findFirstVisibleOnOrAfter = (targetDate, visibleDates) => {
  const found = visibleDates.find((date) => date >= targetDate);
  return found || null;
};

const findLastVisibleOnOrBefore = (targetDate, visibleDates) => {
  for (let i = visibleDates.length - 1; i >= 0; i -= 1) {
    if (visibleDates[i] <= targetDate) return visibleDates[i];
  }
  return null;
};

export default function EcoDataPoints() {
  const [ecoDataPoints, setEcoDataPoints] = useState([]);
  const [ecoChartData, setEcoChartData] = useState([]);
  const [selectedEcoDataPointName, setSelectedEcoDataPointName] = useState("");
  const [selectedEcoDataPointId, setSelectedEcoDataPointId] = useState(null);
  const [ecoError, setEcoError] = useState("");

  const [valueMode, setValueMode] = useState("nominal");
  const [selectedRangePreset, setSelectedRangePreset] = useState("MAX");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [activeStartDate, setActiveStartDate] = useState("");
  const [activeEndDate, setActiveEndDate] = useState("");
  const [showEventMarkers, setShowEventMarkers] = useState(false);
  const [showMacroRegimes, setShowMacroRegimes] = useState(false);

  const chartScrollRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    async function fetchEcoDataPoints() {
      try {
        const response = await axios.get(`${API_URL}/eco-data-points`);
        const points = (response.data || [])
          .filter((point) => NW_HPI_IDS.has(point.eco_data_point_id))
          .sort((a, b) => a.eco_data_point_id - b.eco_data_point_id);

        setEcoDataPoints(points);

        const firstPoint = points[0];
        if (firstPoint) {
          fetchEcoDataPointChartData(
            firstPoint.eco_data_point_id,
            firstPoint.eco_data_point_name
          );
        }
      } catch (err) {
        console.error(err);
        setEcoError("Failed to load eco data points.");
      }
    }

    fetchEcoDataPoints();
  }, [API_URL]);

  useEffect(() => {
    if (!chartScrollRef.current) return;
    if (window.innerWidth > 650) return;
    chartScrollRef.current.scrollLeft = chartScrollRef.current.scrollWidth;
  }, [selectedEcoDataPointId, activeStartDate, activeEndDate, valueMode, showEventMarkers, showMacroRegimes, ecoChartData.length]);

  const fetchEcoDataPointChartData = async (ecoDataPointId, ecoDataPointName) => {
    setSelectedEcoDataPointId(ecoDataPointId);
    setSelectedEcoDataPointName(ecoDataPointName);
    setEcoChartData([]);
    setEcoError("");

    try {
      const response = await axios.get(
        `${API_URL}/hpi-and-priced-in-gold-rebased-to-100`,
        { params: { data_point_id: ecoDataPointId } }
      );

      const data = normaliseHpiSeries(response.data);

      if (!data.length) {
        setEcoError("This eco data point has no data.");
        return;
      }

      setEcoChartData(data);

      const minDate = data[0].price_date;
      const maxDate = data[data.length - 1].price_date;

      setSelectedRangePreset("MAX");
      setActiveStartDate(minDate);
      setActiveEndDate(maxDate);
      setCustomStartDate(minDate);
      setCustomEndDate(maxDate);
      setValueMode("nominal");
    } catch (err) {
      console.error(err);
      setEcoError("Failed to fetch eco data point data.");
    }
  };

  const visiblePoints = useMemo(() => ecoDataPoints, [ecoDataPoints]);

  const chartTitle = useMemo(
    () => selectedEcoDataPointName || "NW HPI",
    [selectedEcoDataPointName]
  );

  const hasRealData = useMemo(() => {
    return ecoChartData.some(
      (row) => row.HPI_index_real !== null || row.HPI_gold_index_real !== null
    );
  }, [ecoChartData]);

  const effectiveValueMode = hasRealData ? valueMode : "nominal";

  const rangeFilteredData = useMemo(() => {
    if (!ecoChartData.length || !activeStartDate || !activeEndDate) return [];
    return ecoChartData.filter(
      (row) => row.price_date >= activeStartDate && row.price_date <= activeEndDate
    );
  }, [ecoChartData, activeStartDate, activeEndDate]);

  const chartData = useMemo(() => {
    return rangeFilteredData.map((row) => ({
      ...row,
      HPI_index_display:
        effectiveValueMode === "real"
          ? row.HPI_index_real ?? null
          : row.HPI_index_nominal ?? null,
      HPI_gold_index_display:
        effectiveValueMode === "real"
          ? row.HPI_gold_index_real ?? null
          : row.HPI_gold_index_nominal ?? null,
    }));
  }, [rangeFilteredData, effectiveValueMode]);

  const handlePresetRange = (preset) => {
    if (!ecoChartData.length) return;

    const minDate = ecoChartData[0].price_date;
    const maxDate = ecoChartData[ecoChartData.length - 1].price_date;
    const newStart = getPresetStartDate(preset, maxDate, minDate);

    setSelectedRangePreset(preset);
    setActiveStartDate(newStart);
    setActiveEndDate(maxDate);
    setCustomStartDate(newStart);
    setCustomEndDate(maxDate);
  };

  const handleApplyCustomRange = () => {
    if (!ecoChartData.length) return;

    const minDate = ecoChartData[0].price_date;
    const maxDate = ecoChartData[ecoChartData.length - 1].price_date;

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

  const labels = useMemo(() => chartData.map((row) => row.price_date), [chartData]);

  const annotations = useMemo(() => {
    const annotationConfig = {};
    if (!labels.length) return annotationConfig;

    const visibleStart = labels[0];
    const visibleEnd = labels[labels.length - 1];

    if (showMacroRegimes) {
      MACRO_REGIMES.forEach((regime) => {
        const overlapsRange = regime.end >= visibleStart && regime.start <= visibleEnd;
        if (!overlapsRange) return;

        const xMin = findFirstVisibleOnOrAfter(regime.start, labels) || visibleStart;
        const xMax = findLastVisibleOnOrBefore(regime.end, labels) || visibleEnd;
        if (!xMin || !xMax || xMin > xMax) return;

        const isQE = regime.type === "qe";

        annotationConfig[`box_${regime.id}`] = {
          type: "box",
          xMin,
          xMax,
          backgroundColor: isQE ? "rgba(0, 121, 107, 0.10)" : "rgba(255, 159, 64, 0.12)",
          borderColor: isQE ? "rgba(0, 121, 107, 0.35)" : "rgba(255, 159, 64, 0.4)",
          borderWidth: 1,
          label: {
            display: true,
            content: regime.label,
            position: "start",
            color: isQE ? "#00796b" : "#d97706",
            backgroundColor: "rgba(255,255,255,0.85)",
            padding: 4,
            font: {
              size: 10,
              weight: "600",
            },
          },
        };
      });
    }

    if (showEventMarkers) {
      EVENT_MARKERS.forEach((event) => {
        if (event.date < visibleStart || event.date > visibleEnd) return;

        const snappedDate = findNearestVisibleDate(event.date, labels);
        if (!snappedDate) return;

        annotationConfig[`line_${event.id}`] = {
          type: "line",
          xMin: snappedDate,
          xMax: snappedDate,
          borderColor: "#c62828",
          borderWidth: 1.5,
          borderDash: [6, 4],
          label: {
            display: true,
            content: event.label,
            rotation: -90,
            position: "start",
            yAdjust: -10,
            backgroundColor: "rgba(198, 40, 40, 0.90)",
            color: "#ffffff",
            font: {
              size: 10,
              weight: "600",
            },
            padding: 4,
          },
        };
      });
    }

    return annotationConfig;
  }, [showEventMarkers, showMacroRegimes, labels]);

  const data = {
    labels,
    datasets: [
      {
        label:
          effectiveValueMode === "real"
            ? "NW HPI Index (Real)"
            : "NW HPI Index",
        data: chartData.map((row) => row.HPI_index_display),
        borderColor: "#e84d4d",
        backgroundColor: "rgba(232, 77, 77, 0.08)",
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.15,
        spanGaps: true,
        yAxisID: "yLeft",
      },
      {
        label:
          effectiveValueMode === "real"
            ? "NW HPI Gold Index (Real)"
            : "NW HPI Gold Index",
        data: chartData.map((row) => row.HPI_gold_index_display),
        borderColor: "#00796b",
        backgroundColor: "rgba(0, 121, 107, 0.08)",
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
        tension: 0.15,
        spanGaps: true,
        yAxisID: "yRight",
      },
    ],
  };

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
    scales: {
      x: {
        type: "category",
        title: { display: true, text: "Date", color: "#00796b" },
        ticks: {
          color: "#00796b",
          maxTicksLimit: 10,
          callback: function (value) {
            const label = this.getLabelForValue(value);
            return label ? new Date(label).getFullYear() : "";
          },
        },
        grid: { color: "rgb(202, 202, 202)" },
      },
      yLeft: {
        type: "linear",
        position: "left",
        title: {
          display: true,
          text:
            effectiveValueMode === "real"
              ? "NW HPI Index (Real)"
              : "NW HPI Index (Nominal)",
          color: "#00796b",
        },
        ticks: { color: "#00796b", beginAtZero: false },
        grid: { color: "rgb(202, 202, 202)" },
      },
      yRight: {
        type: "linear",
        position: "right",
        title: {
          display: true,
          text:
            effectiveValueMode === "real"
              ? "NW HPI Gold Index (Real)"
              : "NW HPI Gold Index (Nominal)",
          color: "#00796b",
        },
        ticks: { color: "#00796b", beginAtZero: false },
        grid: { drawOnChartArea: false },
      },
    },
    plugins: {
      legend: {
        labels: { color: "#00796b" },
      },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#123c36",
        bodyColor: "#123c36",
        borderColor: "rgba(0, 121, 107, 0.18)",
        borderWidth: 1,
        padding: 12,
        callbacks: {
          title: (items) => {
            if (!items.length) return "";
            const date = items[0].label;
            const d = new Date(date);
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
          },
        },
      },
      annotation: {
        clip: false,
        annotations,
      },
      zoom: {
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
        pan: { enabled: true, mode: "x" },
      },
    },
  };

  return (
    <div className="edp-container">
      <aside className="edp-sidebar">
        <div className="edp-desktop-controls">
          <h2 className="edp-sidebar-title">NW HPI Series</h2>

          <ul className="edp-point-list">
            {visiblePoints.length > 0 ? (
              visiblePoints.map((point) => (
                <li
                  key={point.eco_data_point_id}
                  className={`edp-point-item ${
                    selectedEcoDataPointId === point.eco_data_point_id
                      ? "edp-selected-point"
                      : ""
                  }`}
                  onClick={() =>
                    fetchEcoDataPointChartData(
                      point.eco_data_point_id,
                      point.eco_data_point_name
                    )
                  }
                >
                  {point.eco_data_point_name}
                </li>
              ))
            ) : (
              <li className="edp-empty-item">No NW HPI series available.</li>
            )}
          </ul>

          <div className="edp-sidebar-section">
            <h3 className="edp-sidebar-subtitle">View</h3>
            <div className="edp-toggle-group">
              <button
                className={effectiveValueMode === "nominal" ? "selected" : ""}
                onClick={() => setValueMode("nominal")}
              >
                Nominal
              </button>
              <button
                className={effectiveValueMode === "real" ? "selected" : ""}
                onClick={() => {
                  if (hasRealData) setValueMode("real");
                }}
                disabled={!hasRealData}
              >
                Real
              </button>
            </div>

            {!hasRealData && (
              <div className="edp-sidebar-note">
                Real series are not available from this endpoint yet.
              </div>
            )}
          </div>

          <div className="edp-sidebar-section">
            <h3 className="edp-sidebar-subtitle">Overlays</h3>
            <div className="edp-toggle-stack">
              <button
                className={showEventMarkers ? "selected" : ""}
                onClick={() => setShowEventMarkers((prev) => !prev)}
              >
                Event Markers
              </button>
              <button
                className={showMacroRegimes ? "selected" : ""}
                onClick={() => setShowMacroRegimes((prev) => !prev)}
              >
                QE / Rate Cycles
              </button>
            </div>
          </div>
        </div>

        <div className="edp-mobile-controls">
          <div className="edp-mobile-card">
            <div className="edp-mobile-section">
              <div className="edp-mobile-label">NW HPI Series</div>
              <select
                className="edp-mobile-select"
                value={selectedEcoDataPointId ?? ""}
                onChange={(e) => {
                  const selectedId = Number(e.target.value);
                  const selectedPoint = visiblePoints.find(
                    (point) => point.eco_data_point_id === selectedId
                  );
                  if (selectedPoint) {
                    fetchEcoDataPointChartData(
                      selectedPoint.eco_data_point_id,
                      selectedPoint.eco_data_point_name
                    );
                  }
                }}
              >
                {visiblePoints.map((point) => (
                  <option
                    key={point.eco_data_point_id}
                    value={point.eco_data_point_id}
                  >
                    {point.eco_data_point_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="edp-mobile-section">
              <div className="edp-mobile-label">View</div>
              <div className="edp-mobile-chip-row edp-mobile-chip-grid-2">
                <button
                  className={`edp-mobile-chip ${
                    effectiveValueMode === "nominal" ? "selected" : ""
                  }`}
                  onClick={() => setValueMode("nominal")}
                >
                  Nominal
                </button>
                <button
                  className={`edp-mobile-chip ${
                    effectiveValueMode === "real" ? "selected" : ""
                  }`}
                  onClick={() => {
                    if (hasRealData) setValueMode("real");
                  }}
                  disabled={!hasRealData}
                >
                  Real
                </button>
              </div>

              {!hasRealData && (
                <div className="edp-mobile-note">
                  Real series are not available from this endpoint yet.
                </div>
              )}
            </div>

            <div className="edp-mobile-section">
              <div className="edp-mobile-label">Overlays</div>
              <div className="edp-mobile-chip-row edp-mobile-chip-grid-2">
                <button
                  className={`edp-mobile-chip ${
                    showEventMarkers ? "selected" : ""
                  }`}
                  onClick={() => setShowEventMarkers((prev) => !prev)}
                >
                  Event Markers
                </button>
                <button
                  className={`edp-mobile-chip ${
                    showMacroRegimes ? "selected" : ""
                  }`}
                  onClick={() => setShowMacroRegimes((prev) => !prev)}
                >
                  QE / Rate Cycles
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="edp-main">
        {ecoError && <p className="edp-error">{ecoError}</p>}

        <h1 className="edp-title">{chartTitle}</h1>

        <div className="edp-toolbar">
          <div className="edp-range-presets">
            {RANGE_PRESETS.map((range) => (
              <button
                key={range}
                className={`edp-range-btn ${
                  selectedRangePreset === range ? "selected" : ""
                }`}
                onClick={() => handlePresetRange(range)}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="edp-custom-date-controls">
            <div className="edp-date-input-group">
              <label htmlFor="edp-start-date">Start</label>
              <input
                id="edp-start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>

            <div className="edp-date-input-group">
              <label htmlFor="edp-end-date">End</label>
              <input
                id="edp-end-date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>

            <button className="edp-apply-range-btn" onClick={handleApplyCustomRange}>
              Apply
            </button>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="edp-chart-card">
            <div className="edp-chart-header">
              <div>
                <div className="edp-chart-kicker">
                  NW HPI • {effectiveValueMode === "real" ? "REAL" : "NOMINAL"}
                </div>
                <div className="edp-chart-name">{selectedEcoDataPointName}</div>
              </div>

              {(showEventMarkers || showMacroRegimes) && (
                <div className="edp-overlay-legend">
                  {showEventMarkers && (
                    <div className="edp-overlay-chip edp-overlay-chip-event">
                      Event marker
                    </div>
                  )}
                  {showMacroRegimes && (
                    <>
                      <div className="edp-overlay-chip edp-overlay-chip-qe">QE</div>
                      <div className="edp-overlay-chip edp-overlay-chip-hike">Rate cycle</div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="edp-chart-scroll-hint">Swipe sideways to view the full chart</div>
            <div className="edp-chart-scroll-area" ref={chartScrollRef}>
              <div className="edp-chart-canvas">
                <Line data={data} options={chartOptions} />
              </div>
            </div>

            <div className="edp-range-summary">
              <span>{activeStartDate || "-"}</span>
              <span>{activeEndDate || "-"}</span>
            </div>
          </div>
        ) : (
          <div className="edp-empty-state">
            <p>Select a series from the left to view the chart.</p>
          </div>
        )}
      </div>
    </div>
  );
}