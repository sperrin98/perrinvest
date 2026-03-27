import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import axios from "axios";
import "./EcoDataPoints.css";

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

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatAxisDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}`;
};

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
  return visibleDates.find((date) => date >= targetDate) || null;
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

  const visibleDates = useMemo(
    () => chartData.map((row) => row.price_date),
    [chartData]
  );

  const visibleStart = visibleDates[0];
  const visibleEnd = visibleDates[visibleDates.length - 1];

  const snappedEvents = useMemo(() => {
    if (!visibleStart || !visibleEnd || !visibleDates.length) return [];

    return EVENT_MARKERS
      .filter((event) => event.date >= visibleStart && event.date <= visibleEnd)
      .map((event) => ({
        ...event,
        snappedDate: findNearestVisibleDate(event.date, visibleDates),
      }))
      .filter((event) => event.snappedDate);
  }, [visibleStart, visibleEnd, visibleDates]);

  const visibleRegimes = useMemo(() => {
    if (!visibleStart || !visibleEnd || !visibleDates.length) return [];

    return MACRO_REGIMES
      .filter((regime) => regime.end >= visibleStart && regime.start <= visibleEnd)
      .map((regime) => {
        const x1 =
          findFirstVisibleOnOrAfter(regime.start, visibleDates) || visibleStart;
        const x2 =
          findLastVisibleOnOrBefore(regime.end, visibleDates) || visibleEnd;

        return { ...regime, x1, x2 };
      })
      .filter((regime) => regime.x1 && regime.x2 && regime.x1 <= regime.x2);
  }, [visibleStart, visibleEnd, visibleDates]);

  const yAxisLeftLabel =
    effectiveValueMode === "real"
      ? "NW HPI Index (Real)"
      : "NW HPI Index (Nominal)";

  const yAxisRightLabel =
    effectiveValueMode === "real"
      ? "NW HPI Gold Index (Real)"
      : "NW HPI Gold Index (Nominal)";

  const tooltipLabel = effectiveValueMode === "real" ? "Real" : "Nominal";

  return (
    <div className="edp-container">
      <aside className="edp-sidebar">
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
            </div>

            <div className="edp-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 28, left: 8, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                  <XAxis
                    dataKey="price_date"
                    tickFormatter={formatAxisDate}
                    minTickGap={24}
                  />
                  <YAxis
                    yAxisId="left"
                    label={{
                      value: yAxisLeftLabel,
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{
                      value: yAxisRightLabel,
                      angle: 90,
                      position: "insideRight",
                    }}
                  />
                  <Tooltip
                    labelFormatter={formatDate}
                    formatter={(value, name) => [
                      value,
                      name.includes("Gold")
                        ? `${tooltipLabel} NW HPI Gold Index`
                        : `${tooltipLabel} NW HPI Index`,
                    ]}
                  />
                  <Legend />

                  {showMacroRegimes &&
                    visibleRegimes.map((regime) => (
                      <ReferenceArea
                        key={regime.id}
                        x1={regime.x1}
                        x2={regime.x2}
                        yAxisId="left"
                        stroke={regime.type === "qe" ? "#00796b" : "#d97706"}
                        fill={regime.type === "qe" ? "#00796b" : "#f59e0b"}
                        fillOpacity={0.08}
                        ifOverflow="extendDomain"
                      />
                    ))}

                  {showEventMarkers &&
                    snappedEvents.map((event) => (
                      <ReferenceLine
                        key={event.id}
                        x={event.snappedDate}
                        yAxisId="left"
                        stroke="#c62828"
                        strokeDasharray="6 4"
                        strokeWidth={1.5}
                        label={{
                          value: event.label,
                          angle: -90,
                          position: "insideTop",
                          fill: "#c62828",
                          fontSize: 10,
                        }}
                      />
                    ))}

                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="HPI_index_display"
                    stroke="#e84d4d"
                    strokeWidth={1.5}
                    dot={false}
                    name={
                      effectiveValueMode === "real"
                        ? "NW HPI Index (Real)"
                        : "NW HPI Index"
                    }
                    connectNulls
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="HPI_gold_index_display"
                    stroke="#00796b"
                    strokeWidth={1.5}
                    dot={false}
                    name={
                      effectiveValueMode === "real"
                        ? "NW HPI Gold Index (Real)"
                        : "NW HPI Gold Index"
                    }
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="edp-range-summary">
              <span>{activeStartDate ? formatDate(activeStartDate) : "-"}</span>
              <span>{activeEndDate ? formatDate(activeEndDate) : "-"}</span>
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