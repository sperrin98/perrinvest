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
  const day = d.getDay(); // 0=Sun .. 6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
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
  const q = Math.floor(d.getMonth() / 3); // 0..3
  d.setMonth(q * 3, 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

// For each bucket, keep the LAST value (so it looks like a price series)
const aggregateSeries = (rows, mode) => {
  // rows: [{ date: "YYYY-MM-DD", value: number }]
  const map = new Map();

  for (const r of rows) {
    const dt = new Date(r.date);
    let keyDate;

    if (mode === "W") keyDate = startOfWeekMonday(dt);
    else if (mode === "M") keyDate = startOfMonth(dt);
    else if (mode === "Q") keyDate = startOfQuarter(dt);
    else keyDate = dt;

    const key = toISODate(keyDate);

    // overwrite => keeps last value encountered in that bucket
    map.set(key, { date: key, value: r.value });
  }

  // sort by date ascending
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
};

function MarketRatios() {
  const isMobile = useIsMobile();

  const [marketRatios, setMarketRatios] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredMarketRatios, setFilteredMarketRatios] = useState([]);

  const [selectedRatioId, setSelectedRatioId] = useState(null);
  const [ratioName, setRatioName] = useState("");
  const [ratioData, setRatioData] = useState([]); // full fetched series
  const [loadingChart, setLoadingChart] = useState(false);
  const [chartError, setChartError] = useState("");

  // timeframe rail: D/W/M/Q/ALL
  const [timeframe, setTimeframe] = useState("M");

  // Put your "best" ratios here if you want to pin them
  const BEST_RATIO_IDS = [];

  // Fetch list
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

  // Filter list (same logic as you had)
  useEffect(() => {
    if (Array.isArray(marketRatios)) {
      setFilteredMarketRatios(
        marketRatios.filter(
          (marketRatio) =>
            (marketRatio[1] &&
              marketRatio[1]
                .toLowerCase()
                .includes(searchTerm.toLowerCase())) ||
            (marketRatio[2] &&
              marketRatio[2]
                .toLowerCase()
                .includes(searchTerm.toLowerCase()))
        )
      );
    }
  }, [searchTerm, marketRatios]);

  // Split best/all (optional)
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

  // Fetch chart data for selected ratio
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

        // Ensure sorted
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

  // Apply timeframe logic (range + aggregation)
  const displayedSeries = useMemo(() => {
    if (!ratioData || ratioData.length === 0) return [];

    const now = new Date();

    let start = null;

    if (timeframe === "D") start = addYears(now, -1);
    if (timeframe === "W") start = addYears(now, -5);
    if (timeframe === "M") start = addYears(now, -10);

    // Q and ALL are inception -> today
    if (timeframe === "Q") start = null;
    if (timeframe === "ALL") start = null;

    const filtered = start
      ? ratioData.filter((r) => new Date(r.date) >= start)
      : ratioData;

    // Daily views (no aggregation)
    if (timeframe === "D" || timeframe === "ALL") return filtered;

    // Aggregated views
    return aggregateSeries(filtered, timeframe); // W / M / Q
  }, [ratioData, timeframe]);

  // Y-axis dynamic scaling (based on displayed series)
  const values = useMemo(
    () => displayedSeries.map((x) => x.value),
    [displayedSeries]
  );

  const maxValue = values.length ? Math.max(...values) : 0;
  const minValue = values.length ? Math.min(...values) : 0;

  const yAxisConfig = useMemo(() => {
    if (!values.length) {
      return {
        min: 0,
        max: 1,
        stepSize: 1,
      };
    }

    const range = maxValue - minValue;

    // Special handling for compressed series, especially ratios between 0 and 1
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

    // General compressed-range handling
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

    // Original broader-range behaviour
    const yAxisPadding = 0.1;
    const max = Math.max(0, Math.ceil(maxValue * (1 + yAxisPadding)));
    const min = Math.min(0, minValue);
    const stepSize = isMobile
      ? Math.max(1, Math.ceil(max / 6))
      : Math.max(1, Math.ceil(max / 5));

    return { min, max, stepSize };
  }, [values, maxValue, minValue, isMobile]);

  const chartData = useMemo(() => {
    return {
      labels: displayedSeries.map((item) => item.date),
      datasets: [
        {
          label: `${ratioName || "Market Ratio"} (${timeframe})`,
          data: displayedSeries.map((item) => item.value),
          borderColor: "#00796b",
          backgroundColor: "#00796b",
          borderWidth: 1.25,
          pointRadius: 0,
          tension: 0.25,
          fill: false,
        },
      ],
    };
  }, [displayedSeries, ratioName, timeframe]);

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
              return `${context.dataset.label}: ${context.raw}`;
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
      {/* Sidebar */}
      <aside className="mrp-sidebar">
        {/* Mini rail */}
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

        {/* Scroll content */}
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

      {/* Main chart area */}
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
      </main>
    </div>
  );
}

export default MarketRatios;