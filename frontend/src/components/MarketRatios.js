import React, { useEffect, useMemo, useState } from "react";
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
import "./MarketRatios.css";
import useIsMobile from "./useIsMobile";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// --- helpers ---
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

// For each bucket, keep the LAST value
const aggregateSeries = (rows, mode) => {
  const map = new Map();

  for (const r of rows) {
    const dt = new Date(r.date);
    let keyDate;

    if (mode === "W") keyDate = startOfWeekMonday(dt);
    else if (mode === "M") keyDate = startOfMonth(dt);
    else if (mode === "Q") keyDate = startOfQuarter(dt);
    else keyDate = dt;

    const key = toISODate(keyDate);
    map.set(key, { date: key, value: r.value });
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
};

const mean = (arr) => {
  if (!arr.length) return null;
  return arr.reduce((sum, x) => sum + x, 0) / arr.length;
};

const stdDev = (arr) => {
  if (arr.length < 2) return 0;
  const avg = mean(arr);
  const variance =
    arr.reduce((sum, x) => sum + Math.pow(x - avg, 2), 0) / arr.length;
  return Math.sqrt(variance);
};

const percentileRank = (arr, value) => {
  if (!arr.length || value === null || value === undefined) return null;
  const belowOrEqual = arr.filter((x) => x <= value).length;
  return (belowOrEqual / arr.length) * 100;
};

const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return Number(value).toFixed(decimals);
};

function MarketRatios() {
  const isMobile = useIsMobile();

  const [marketRatios, setMarketRatios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMarketRatios, setFilteredMarketRatios] = useState([]);

  const [selectedRatioId, setSelectedRatioId] = useState(null);
  const [ratioName, setRatioName] = useState("");
  const [ratioData, setRatioData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [chartError, setChartError] = useState("");

  const [timeframe, setTimeframe] = useState("M");

  const BEST_RATIO_IDS = [];

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/market-ratios`)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setMarketRatios(response.data);
          if (response.data.length > 0) {
            setSelectedRatioId(response.data[0][0]);
          }
        } else {
          console.error("Unexpected data format:", response.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching market ratios:", error);
      });
  }, []);

  useEffect(() => {
    if (Array.isArray(marketRatios)) {
      setFilteredMarketRatios(
        marketRatios.filter(
          (marketRatio) =>
            (marketRatio[1] &&
              marketRatio[1].toLowerCase().includes(searchTerm.toLowerCase())) ||
            (marketRatio[2] &&
              marketRatio[2].toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }
  }, [searchTerm, marketRatios]);

  const bestRatios = useMemo(() => {
    if (!Array.isArray(filteredMarketRatios) || BEST_RATIO_IDS.length === 0)
      return [];
    return filteredMarketRatios.filter((r) => BEST_RATIO_IDS.includes(r[0]));
  }, [filteredMarketRatios]);

  const otherRatios = useMemo(() => {
    if (!Array.isArray(filteredMarketRatios)) return [];
    if (BEST_RATIO_IDS.length === 0) return filteredMarketRatios;
    return filteredMarketRatios.filter((r) => !BEST_RATIO_IDS.includes(r[0]));
  }, [filteredMarketRatios]);

  useEffect(() => {
    const fetchMarketRatioData = async () => {
      if (!selectedRatioId) return;

      setLoadingChart(true);
      setChartError("");

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/market-ratios/${selectedRatioId}`
        );

        const data = response.data;

        setRatioName(data.ratio_name || "");

        const formattedRatioData = (data.market_ratio || []).map((item) => ({
          date: new Date(item[0]).toISOString().split("T")[0],
          value: item[1],
        }));

        formattedRatioData.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        setRatioData(formattedRatioData);
      } catch (error) {
        console.error("Error fetching market ratio data:", error);
        setChartError("Failed to load chart data.");
        setRatioData([]);
        setRatioName("");
      } finally {
        setLoadingChart(false);
      }
    };

    fetchMarketRatioData();
  }, [selectedRatioId]);

  const displayedSeries = useMemo(() => {
    if (!ratioData || ratioData.length === 0) return [];

    const now = new Date();
    let start = null;

    if (timeframe === "D") start = addYears(now, -1);
    if (timeframe === "W") start = addYears(now, -5);
    if (timeframe === "M") start = addYears(now, -10);

    if (timeframe === "Q") start = null;
    if (timeframe === "ALL") start = null;

    const filtered = start
      ? ratioData.filter((r) => new Date(r.date) >= start)
      : ratioData;

    if (timeframe === "D" || timeframe === "ALL") return filtered;

    return aggregateSeries(filtered, timeframe);
  }, [ratioData, timeframe]);

  const fullHistoryStats = useMemo(() => {
    if (!ratioData.length) {
      return {
        currentRatio: null,
        longRunMean: null,
        std: null,
        upperBand: null,
        lowerBand: null,
        percentile: null,
        zScore: null,
      };
    }

    const values = ratioData
      .map((x) => Number(x.value))
      .filter((x) => !Number.isNaN(x));

    if (!values.length) {
      return {
        currentRatio: null,
        longRunMean: null,
        std: null,
        upperBand: null,
        lowerBand: null,
        percentile: null,
        zScore: null,
      };
    }

    const currentRatio = values[values.length - 1];
    const longRunMean = mean(values);
    const std = stdDev(values);
    const upperBand = longRunMean + std;
    const lowerBand = longRunMean - std;
    const percentile = percentileRank(values, currentRatio);
    const zScore =
      std && std !== 0 ? (currentRatio - longRunMean) / std : null;

    return {
      currentRatio,
      longRunMean,
      std,
      upperBand,
      lowerBand,
      percentile,
      zScore,
    };
  }, [ratioData]);

  const values = useMemo(
    () => displayedSeries.map((x) => x.value),
    [displayedSeries]
  );

  const chartBandValues = useMemo(() => {
    const arr = [...values];
    if (fullHistoryStats.longRunMean !== null) arr.push(fullHistoryStats.longRunMean);
    if (fullHistoryStats.upperBand !== null) arr.push(fullHistoryStats.upperBand);
    if (fullHistoryStats.lowerBand !== null) arr.push(fullHistoryStats.lowerBand);
    return arr;
  }, [values, fullHistoryStats]);

  const maxValue = chartBandValues.length ? Math.max(...chartBandValues) : 0;
  const minValue = chartBandValues.length ? Math.min(...chartBandValues) : 0;

  const yAxisConfig = useMemo(() => {
    if (!chartBandValues.length) {
      return { min: 0, max: 1, stepSize: 1 };
    }

    const range = maxValue - minValue;

    if (maxValue <= 1 && minValue >= 0) {
      const padding = Math.max(range * 0.12, 0.01);
      const min = Math.max(0, minValue - padding);
      const max = Math.min(1, maxValue + padding);
      const stepSize = Math.max(
        0.01,
        Number(((max - min) / (isMobile ? 6 : 5)).toFixed(3))
      );

      return { min, max, stepSize };
    }

    if (range > 0 && range < 2) {
      const padding = Math.max(range * 0.15, 0.02);
      const min = minValue - padding;
      const max = maxValue + padding;
      const stepSize = Math.max(
        0.01,
        Number(((max - min) / (isMobile ? 6 : 5)).toFixed(3))
      );

      return { min, max, stepSize };
    }

    const padding = Math.max(range * 0.08, 0.1);
    const min = minValue - padding;
    const max = maxValue + padding;
    const stepSize = Math.max(
      0.01,
      Number(((max - min) / (isMobile ? 6 : 5)).toFixed(2))
    );

    return { min, max, stepSize };
  }, [chartBandValues, maxValue, minValue, isMobile]);

  const chartData = useMemo(() => {
    return {
      labels: displayedSeries.map((item) => item.date),
      datasets: [
        {
          label: `${ratioName || "Market Ratio"} (${timeframe})`,
          data: displayedSeries.map((item) => item.value),
          borderColor: "#00796b",
          backgroundColor: "#00796b",
          borderWidth: 1.4,
          pointRadius: 0,
          tension: 0.25,
          fill: false,
        },
        {
          label: "Long-Run Mean",
          data: displayedSeries.map(() => fullHistoryStats.longRunMean),
          borderColor: "#5c6bc0",
          backgroundColor: "#5c6bc0",
          borderWidth: 1,
          pointRadius: 0,
          tension: 0,
          fill: false,
          borderDash: [6, 6],
        },
        {
          label: "+1 Std Band",
          data: displayedSeries.map(() => fullHistoryStats.upperBand),
          borderColor: "#90a4ae",
          backgroundColor: "#90a4ae",
          borderWidth: 1,
          pointRadius: 0,
          tension: 0,
          fill: false,
          borderDash: [4, 4],
        },
        {
          label: "-1 Std Band",
          data: displayedSeries.map(() => fullHistoryStats.lowerBand),
          borderColor: "#90a4ae",
          backgroundColor: "#90a4ae",
          borderWidth: 1,
          pointRadius: 0,
          tension: 0,
          fill: false,
          borderDash: [4, 4],
        },
      ],
    };
  }, [displayedSeries, ratioName, timeframe, fullHistoryStats]);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            color: "#00796b",
            maxTicksLimit: isMobile ? 6 : 10,
          },
          grid: {
            color: "rgba(0,0,0,0.08)",
          },
          title: {
            display: true,
            text: "Date",
            color: "#00796b",
          },
        },
        y: {
          ticks: {
            color: "#00796b",
            stepSize: yAxisConfig.stepSize,
          },
          grid: {
            color: "rgba(0,0,0,0.08)",
          },
          title: {
            display: true,
            text: "Value",
            color: "#00796b",
          },
          min: yAxisConfig.min,
          max: yAxisConfig.max,
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#00796b",
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${formatNumber(context.raw, 3)}`;
            },
          },
        },
      },
    };
  }, [isMobile, yAxisConfig]);

  const handleRatioClick = (id) => {
    setSelectedRatioId(id);
  };

  return (
    <div className="mrp-container">
      <aside className="mrp-sidebar">
        <div className="mrp-miniRail" aria-label="Timeframe selector">
          <button
            className={`mrp-chip ${timeframe === "D" ? "mrp-chip-active" : ""}`}
            onClick={() => setTimeframe("D")}
            type="button"
            title="Daily (1Y)"
          >
            D
          </button>
          <button
            className={`mrp-chip ${timeframe === "W" ? "mrp-chip-active" : ""}`}
            onClick={() => setTimeframe("W")}
            type="button"
            title="Weekly (5Y)"
          >
            W
          </button>
          <button
            className={`mrp-chip ${timeframe === "M" ? "mrp-chip-active" : ""}`}
            onClick={() => setTimeframe("M")}
            type="button"
            title="Monthly (10Y)"
          >
            M
          </button>
          <button
            className={`mrp-chip ${timeframe === "Q" ? "mrp-chip-active" : ""}`}
            onClick={() => setTimeframe("Q")}
            type="button"
            title="Quarterly (Inception)"
          >
            Q
          </button>
          <button
            className={`mrp-chip ${
              timeframe === "ALL" ? "mrp-chip-active" : ""
            }`}
            onClick={() => setTimeframe("ALL")}
            type="button"
            title="All data (Inception)"
          >
            ALL
          </button>
        </div>

        <div className="mrp-sidebarScroll">
          <div className="mrp-search">
            <label htmlFor="mrp-search-input">Search Ratios:</label>
            <input
              id="mrp-search-input"
              type="text"
              placeholder="Search market ratios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {bestRatios.length > 0 && (
            <>
              <h2 className="mrp-sidebar-title">Best Ratios</h2>
              <ul className="mrp-list">
                {bestRatios.map((ratio) => (
                  <li
                    key={ratio[0]}
                    className={`mrp-item ${
                      selectedRatioId === ratio[0] ? "mrp-item-selected" : ""
                    }`}
                    onClick={() => handleRatioClick(ratio[0])}
                  >
                    {ratio[1] || "N/A"}
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2 className="mrp-sidebar-title">
            {bestRatios.length > 0 ? "All Ratios" : "Select Ratio"}
          </h2>

          <ul className="mrp-list">
            {otherRatios.length > 0 ? (
              otherRatios.map((ratio) => (
                <li
                  key={ratio[0]}
                  className={`mrp-item ${
                    selectedRatioId === ratio[0] ? "mrp-item-selected" : ""
                  }`}
                  onClick={() => handleRatioClick(ratio[0])}
                >
                  {ratio[1] || "N/A"}
                </li>
              ))
            ) : (
              <li className="mrp-empty">No market ratios found</li>
            )}
          </ul>
        </div>
      </aside>

      <main className="mrp-main">
        <h1 className="mrp-title">{ratioName || "Market Ratios"}</h1>

        <div className="mrp-chart-wrapper">
          {chartError && <p className="mrp-error">{chartError}</p>}

          {loadingChart ? (
            <div className="mrp-loading">Loading chart…</div>
          ) : displayedSeries.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="mrp-emptyChart">No data for this ratio.</div>
          )}
        </div>

        <section className="mrp-stats-grid">
          <div className="mrp-stat-card">
            <div className="mrp-stat-label">Current Ratio</div>
            <div className="mrp-stat-value">
              {formatNumber(fullHistoryStats.currentRatio, 3)}
            </div>
          </div>

          <div className="mrp-stat-card">
            <div className="mrp-stat-label">Long-Term Percentile</div>
            <div className="mrp-stat-value">
              {formatNumber(fullHistoryStats.percentile, 1)}%
            </div>
          </div>

          <div className="mrp-stat-card">
            <div className="mrp-stat-label">Z-Score</div>
            <div className="mrp-stat-value">
              {formatNumber(fullHistoryStats.zScore, 2)}
            </div>
          </div>

          <div className="mrp-stat-card">
            <div className="mrp-stat-label">Long-Run Mean</div>
            <div className="mrp-stat-value">
              {formatNumber(fullHistoryStats.longRunMean, 3)}
            </div>
          </div>

          <div className="mrp-stat-card">
            <div className="mrp-stat-label">Upper Band</div>
            <div className="mrp-stat-value">
              {formatNumber(fullHistoryStats.upperBand, 3)}
            </div>
          </div>

          <div className="mrp-stat-card">
            <div className="mrp-stat-label">Lower Band</div>
            <div className="mrp-stat-value">
              {formatNumber(fullHistoryStats.lowerBand, 3)}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default MarketRatios;