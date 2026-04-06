import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import annotationPlugin from "chartjs-plugin-annotation";
import "./Petrol.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin,
  annotationPlugin
);

const PETROL_IDS = new Set([36, 37]);
const CRUDE_SECURITY_ID = 44;
const RANGE_PRESETS = ["1Y", "3Y", "5Y", "10Y", "MAX"];

const EVENT_MARKERS = [
  { id: "iraq", label: "2003 Iraq War", date: "2003-03-20" },
  { id: "gfc", label: "2008 GFC", date: "2008-09-15" },
  { id: "arabspring", label: "2011 Arab Spring", date: "2011-01-25" },
  { id: "oilcrash", label: "2014 Oil Crash", date: "2014-11-27" },
  { id: "brexit", label: "2016 Brexit Vote", date: "2016-06-23" },
  { id: "ukraine", label: "2022 Ukraine Invasion", date: "2022-02-24" },
];

const MACRO_REGIMES = [
  { id: "qe1", label: "QE1", start: "2008-11-25", end: "2010-03-31", type: "qe" },
  { id: "qe2", label: "QE2", start: "2010-11-03", end: "2011-06-30", type: "qe" },
  { id: "qe3", label: "QE3", start: "2012-09-13", end: "2014-10-29", type: "qe" },
  { id: "qe_pandemic", label: "Pandemic QE", start: "2020-03-15", end: "2022-03-15", type: "qe" },
  { id: "hike_2004", label: "Rate Hike Cycle", start: "2004-06-30", end: "2006-08-08", type: "hike" },
  { id: "hike_2015", label: "Rate Hike Cycle", start: "2015-12-16", end: "2018-12-19", type: "hike" },
  { id: "hike_2022", label: "Rate Hike Cycle", start: "2022-03-16", end: "2023-07-26", type: "hike" },
];

const parseNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toISODate = (value) => {
  if (!value) return null;

  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
};

const extractRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  if (Array.isArray(payload.price_history)) return payload.price_history;
  if (Array.isArray(payload.price_histories)) return payload.price_histories;
  if (Array.isArray(payload.histories)) return payload.histories;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.rows)) return payload.rows;

  if (payload.data && Array.isArray(payload.data.price_history)) {
    return payload.data.price_history;
  }
  if (payload.data && Array.isArray(payload.data.price_histories)) {
    return payload.data.price_histories;
  }

  return [];
};

const getRowDate = (row) => {
  if (Array.isArray(row)) return toISODate(row[1]);
  return toISODate(row.price_date || row.date);
};

const getRowPrice = (row) => {
  if (Array.isArray(row)) return parseNumber(row[2]);
  return parseNumber(row.price);
};

const normalisePetrolSeries = (payload) => {
  const rows = extractRows(payload);

  return rows
    .map((row) => ({
      price_date: getRowDate(row),
      petrol_price: getRowPrice(row),
    }))
    .filter((row) => row.price_date && row.petrol_price !== null)
    .sort((a, b) => new Date(a.price_date) - new Date(b.price_date));
};

const normaliseCrudeSeries = (payload) => {
  const rows = extractRows(payload);

  return rows
    .map((row) => ({
      price_date: getRowDate(row),
      crude_price: getRowPrice(row),
    }))
    .filter((row) => row.price_date && row.crude_price !== null)
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

const findFirstVisibleOnOrAfter = (targetDate, visibleDates) => {
  return visibleDates.find((date) => date >= targetDate) || null;
};

const findLastVisibleOnOrBefore = (targetDate, visibleDates) => {
  for (let i = visibleDates.length - 1; i >= 0; i -= 1) {
    if (visibleDates[i] <= targetDate) return visibleDates[i];
  }
  return null;
};

const alignSeriesToLabelsUsingCarryForward = (labels, sourceRows, valueKey) => {
  if (!labels.length || !sourceRows.length) return [];

  const sortedRows = [...sourceRows].sort(
    (a, b) => new Date(a.price_date) - new Date(b.price_date)
  );

  let sourceIndex = 0;
  let lastKnownValue = null;

  return labels.map((labelDate) => {
    while (
      sourceIndex < sortedRows.length &&
      sortedRows[sourceIndex].price_date <= labelDate
    ) {
      lastKnownValue = sortedRows[sourceIndex][valueKey];
      sourceIndex += 1;
    }

    return lastKnownValue;
  });
};

export default function Petrol() {
  const [petrolDataPoints, setPetrolDataPoints] = useState([]);
  const [petrolChartData, setPetrolChartData] = useState([]);
  const [crudeChartData, setCrudeChartData] = useState([]);

  const [selectedPetrolName, setSelectedPetrolName] = useState("");
  const [selectedPetrolId, setSelectedPetrolId] = useState(null);
  const [petrolError, setPetrolError] = useState("");
  const [crudeError, setCrudeError] = useState("");

  const [selectedRangePreset, setSelectedRangePreset] = useState("MAX");
  const [activeStartDate, setActiveStartDate] = useState("");
  const [activeEndDate, setActiveEndDate] = useState("");

  const [showEventMarkers, setShowEventMarkers] = useState(true);
  const [showMacroRegimes, setShowMacroRegimes] = useState(true);
  const [showCrudeOverlay, setShowCrudeOverlay] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    async function fetchPetrolDataPoints() {
      try {
        const response = await axios.get(`${API_URL}/eco-data-points`);
        const points = (response.data || [])
          .filter((point) => PETROL_IDS.has(point.eco_data_point_id))
          .sort((a, b) => a.eco_data_point_id - b.eco_data_point_id);

        setPetrolDataPoints(points);

        const firstPoint = points[0];
        if (firstPoint) {
          fetchPetrolChartData(
            firstPoint.eco_data_point_id,
            firstPoint.eco_data_point_name
          );
        }
      } catch (err) {
        console.error(err);
        setPetrolError("Failed to load petrol data points.");
      }
    }

    fetchPetrolDataPoints();
  }, [API_URL]);

  useEffect(() => {
    async function fetchCrudeChartData() {
      setCrudeError("");

      try {
        let data = [];

        try {
          const response = await axios.get(
            `${API_URL}/securities/${CRUDE_SECURITY_ID}/price-histories`,
            { params: { timeframe: "all" } }
          );
          data = normaliseCrudeSeries(response.data);
        } catch (innerErr) {
          console.warn("Primary crude route failed:", innerErr);
        }

        if (!data.length) {
          const fallbackResponse = await axios.get(
            `${API_URL}/securities/${CRUDE_SECURITY_ID}`
          );
          data = normaliseCrudeSeries(fallbackResponse.data?.price_history || []);
        }

        setCrudeChartData(data);

        if (!data.length) {
          setCrudeError("No crude oil price history returned.");
        }
      } catch (err) {
        console.error("Failed to load crude oil overlay:", err);
        setCrudeChartData([]);
        setCrudeError("Failed to load price history of crude oil.");
      }
    }

    fetchCrudeChartData();
  }, [API_URL]);

  const fetchPetrolChartData = async (ecoDataPointId, ecoDataPointName) => {
    setSelectedPetrolId(ecoDataPointId);
    setSelectedPetrolName(ecoDataPointName);
    setPetrolChartData([]);
    setPetrolError("");

    try {
      const response = await axios.get(
        `${API_URL}/eco-data-points/${ecoDataPointId}/histories`
      );

      const data = normalisePetrolSeries(response.data);

      if (!data.length) {
        setPetrolError("This petrol data point has no data.");
        return;
      }

      setPetrolChartData(data);

      const minDate = data[0].price_date;
      const maxDate = data[data.length - 1].price_date;

      setSelectedRangePreset("MAX");
      setActiveStartDate(minDate);
      setActiveEndDate(maxDate);
    } catch (err) {
      console.error(err);
      setPetrolError("Failed to fetch petrol data point data.");
    }
  };

  const visiblePoints = useMemo(() => petrolDataPoints, [petrolDataPoints]);

  const chartTitle = useMemo(
    () => selectedPetrolName || "UK Petrol Prices",
    [selectedPetrolName]
  );

  const rangeFilteredData = useMemo(() => {
    if (!petrolChartData.length || !activeStartDate || !activeEndDate) return [];

    return petrolChartData.filter(
      (row) => row.price_date >= activeStartDate && row.price_date <= activeEndDate
    );
  }, [petrolChartData, activeStartDate, activeEndDate]);

  const handlePresetRange = (preset) => {
    if (!petrolChartData.length) return;

    const minDate = petrolChartData[0].price_date;
    const maxDate = petrolChartData[petrolChartData.length - 1].price_date;
    const newStart = getPresetStartDate(preset, maxDate, minDate);

    setSelectedRangePreset(preset);
    setActiveStartDate(newStart);
    setActiveEndDate(maxDate);
  };

  const labels = useMemo(
    () => rangeFilteredData.map((row) => row.price_date),
    [rangeFilteredData]
  );

  const alignedCrudeData = useMemo(() => {
    if (!showCrudeOverlay || !labels.length || !crudeChartData.length) {
      return [];
    }

    return alignSeriesToLabelsUsingCarryForward(
      labels,
      crudeChartData,
      "crude_price"
    );
  }, [labels, crudeChartData, showCrudeOverlay]);

  const annotations = useMemo(() => {
    if (!labels.length) return {};

    const annotationConfig = {};
    const visibleStart = labels[0];
    const visibleEnd = labels[labels.length - 1];

    if (showMacroRegimes) {
      MACRO_REGIMES.forEach((regime) => {
        const overlapsRange = regime.end >= visibleStart && regime.start <= visibleEnd;
        if (!overlapsRange) return;

        const xMin = findFirstVisibleOnOrAfter(regime.start, labels);
        const xMax = findLastVisibleOnOrBefore(regime.end, labels);

        if (!xMin || !xMax || xMin > xMax) return;

        const isQE = regime.type === "qe";

        annotationConfig[`box_${regime.id}`] = {
          type: "box",
          drawTime: "beforeDatasetsDraw",
          xScaleID: "x",
          xMin,
          xMax,
          backgroundColor: isQE
            ? "rgba(0, 121, 107, 0.10)"
            : "rgba(255, 159, 64, 0.12)",
          borderColor: isQE
            ? "rgba(0, 121, 107, 0.35)"
            : "rgba(255, 159, 64, 0.45)",
          borderWidth: 1,
          label: {
            display: true,
            content: regime.label,
            position: "start",
            color: isQE ? "#00796b" : "#d97706",
            backgroundColor: "rgba(255,255,255,0.92)",
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
      EVENT_MARKERS.forEach((event, index) => {
        const xValue = findFirstVisibleOnOrAfter(event.date, labels);
        if (!xValue) return;

        annotationConfig[`event_${event.id}`] = {
          type: "line",
          drawTime: "afterDatasetsDraw",
          xScaleID: "x",
          xMin: xValue,
          xMax: xValue,
          borderColor: "rgba(198, 40, 40, 0.95)",
          borderWidth: 2,
          borderDash: [6, 4],
          label: {
            display: true,
            content: event.label,
            position: "start",
            yAdjust: 10 + (index % 3) * 16,
            backgroundColor: "rgba(198, 40, 40, 0.92)",
            color: "#ffffff",
            padding: 4,
            font: {
              size: 10,
              weight: "600",
            },
          },
        };
      });
    }

    return annotationConfig;
  }, [labels, showMacroRegimes, showEventMarkers]);

  const data = useMemo(() => {
    const lineStyle = {
      borderWidth: 2.2,
      pointRadius: 0,
      pointHoverRadius: 3,
      fill: false,
      tension: 0.15,
      spanGaps: true,
    };

    const datasets = [
      {
        label: "UK Petrol Price",
        data: rangeFilteredData.map((row) => row.petrol_price),
        borderColor: "#00796b",
        backgroundColor: "rgba(0, 121, 107, 0.08)",
        yAxisID: "y",
        ...lineStyle,
      },
    ];

    if (showCrudeOverlay && alignedCrudeData.some((value) => value !== null)) {
      datasets.push({
        label: "Crude Oil Price",
        data: alignedCrudeData,
        borderColor: "#c62828",
        backgroundColor: "rgba(198, 40, 40, 0.08)",
        yAxisID: "y1",
        ...lineStyle,
      });
    }

    return {
      labels,
      datasets,
    };
  }, [rangeFilteredData, showCrudeOverlay, alignedCrudeData, labels]);

  const chartOptions = useMemo(() => {
    const crudeValues = alignedCrudeData.filter((value) => value !== null);
    const hasCrudeValues = showCrudeOverlay && crudeValues.length > 0;

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 220,
        easing: "easeOutQuart",
      },
      interaction: {
        mode: "index",
        intersect: false,
      },
      elements: {
        line: {
          capBezierPoints: true,
        },
      },
      scales: {
        x: {
          type: "category",
          offset: false,
          title: { display: true, text: "Date", color: "#00796b" },
          ticks: {
            color: "#00796b",
            maxTicksLimit: 10,
            autoSkip: true,
            callback(value) {
              const label = this.getLabelForValue(value);
              return label ? new Date(label).getFullYear() : "";
            },
          },
          grid: { color: "rgb(202, 202, 202)" },
        },
        y: {
          type: "linear",
          position: "left",
          title: {
            display: true,
            text: "Petrol Price",
            color: "#00796b",
          },
          ticks: {
            color: "#00796b",
            beginAtZero: false,
          },
          grid: { color: "rgb(202, 202, 202)" },
        },
        y1: {
          type: "linear",
          position: "right",
          display: hasCrudeValues,
          title: {
            display: hasCrudeValues,
            text: "Crude Oil Price",
            color: "#c62828",
          },
          ticks: {
            color: "#c62828",
            beginAtZero: false,
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#00796b",
            usePointStyle: true,
            pointStyle: "line",
            padding: 16,
          },
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
          pan: {
            enabled: true,
            mode: "x",
          },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "x",
          },
        },
      },
    };
  }, [annotations, showCrudeOverlay, alignedCrudeData]);

  return (
    <div className="petrol-container">
      <aside className="petrol-sidebar">
        <h2 className="petrol-sidebar-title">UK Petrol Series</h2>

        <ul className="petrol-point-list">
          {visiblePoints.length > 0 ? (
            visiblePoints.map((point) => (
              <li
                key={point.eco_data_point_id}
                className={`petrol-point-item ${
                  selectedPetrolId === point.eco_data_point_id
                    ? "petrol-selected-point"
                    : ""
                }`}
                onClick={() =>
                  fetchPetrolChartData(
                    point.eco_data_point_id,
                    point.eco_data_point_name
                  )
                }
              >
                {point.eco_data_point_name}
              </li>
            ))
          ) : (
            <li className="petrol-empty-item">No petrol series available.</li>
          )}
        </ul>

        <div className="petrol-sidebar-section">
          <h3 className="petrol-sidebar-subtitle">Overlays</h3>
          <div className="petrol-toggle-stack">
            <button
              type="button"
              className={showEventMarkers ? "selected" : ""}
              onClick={() => setShowEventMarkers((prev) => !prev)}
            >
              Event Markers
            </button>

            <button
              type="button"
              className={showMacroRegimes ? "selected" : ""}
              onClick={() => setShowMacroRegimes((prev) => !prev)}
            >
              QE / Rate Cycles
            </button>

            <button
              type="button"
              className={showCrudeOverlay ? "selected" : ""}
              onClick={() => setShowCrudeOverlay((prev) => !prev)}
            >
              Crude Oil Overlay
            </button>
          </div>

          {crudeError && (
            <p className="petrol-error" style={{ marginTop: "10px" }}>
              {crudeError}
            </p>
          )}
        </div>
      </aside>

      <div className="petrol-main">
        {petrolError && <p className="petrol-error">{petrolError}</p>}

        <h1 className="petrol-title">{chartTitle}</h1>

        <div className="petrol-toolbar">
          <div className="petrol-range-presets">
            {RANGE_PRESETS.map((range) => (
              <button
                type="button"
                key={range}
                className={`petrol-range-btn ${
                  selectedRangePreset === range ? "selected" : ""
                }`}
                onClick={() => handlePresetRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {rangeFilteredData.length > 0 ? (
          <div className="petrol-chart-card">
            <div className="petrol-chart-header">
              <div>
                <div className="petrol-chart-kicker">UK PETROL</div>
                <div className="petrol-chart-name">{selectedPetrolName}</div>
              </div>

              {(showEventMarkers || showMacroRegimes || showCrudeOverlay) && (
                <div className="petrol-overlay-legend">
                  {showEventMarkers && (
                    <div className="petrol-overlay-chip petrol-overlay-chip-event">
                      Event marker
                    </div>
                  )}
                  {showMacroRegimes && (
                    <>
                      <div className="petrol-overlay-chip petrol-overlay-chip-qe">
                        QE
                      </div>
                      <div className="petrol-overlay-chip petrol-overlay-chip-hike">
                        Rate cycle
                      </div>
                    </>
                  )}
                  {showCrudeOverlay && (
                    <div className="petrol-overlay-chip petrol-overlay-chip-crude">
                      Crude oil
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="petrol-chart-canvas">
              <Line
                key={`${selectedPetrolId}-${activeStartDate}-${activeEndDate}-${showEventMarkers}-${showMacroRegimes}-${showCrudeOverlay}`}
                data={data}
                options={chartOptions}
                redraw
              />
            </div>

            <div className="petrol-range-summary">
              <span>{activeStartDate || "-"}</span>
              <span>{activeEndDate || "-"}</span>
            </div>
          </div>
        ) : (
          <div className="petrol-empty-state">
            <p>Select a series from the left to view the chart.</p>
          </div>
        )}
      </div>
    </div>
  );
}