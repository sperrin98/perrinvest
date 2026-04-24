// Seasonality.js

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./Seasonality.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  Title
);

const API_URL = process.env.REACT_APP_API_URL;
const DEFAULT_START_DATE = "2010-01-01";

const monthLabels = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatDateLabel = (dateString) => {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;

  return `${monthLabels[d.getMonth()]} ${d.getDate()}`;
};

function Seasonality() {
  const [securities, setSecurities] = useState([]);
  const [loadingSecurities, setLoadingSecurities] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState("");

  const [assetClass, setAssetClass] = useState("");
  const [assetClassQuery, setAssetClassQuery] = useState("");
  const [assetClassOpen, setAssetClassOpen] = useState(false);
  const [assetClassTyping, setAssetClassTyping] = useState(false);

  const [selectedSecurityId, setSelectedSecurityId] = useState("");
  const [startDate, setStartDate] = useState(DEFAULT_START_DATE);
  const [chartData, setChartData] = useState([]);

  const assetClassRef = useRef(null);
  const chartScrollRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (assetClassRef.current && !assetClassRef.current.contains(e.target)) {
        setAssetClassOpen(false);
      }
    };

    document.addEventListener("mousedown", onClick);

    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const fetchSecurities = async () => {
      try {
        setLoadingSecurities(true);
        setError("");

        const response = await axios.get(`${API_URL}/seasonality-securities`);
        const rows = Array.isArray(response.data) ? response.data : [];

        setSecurities(rows);

        const classes = [
          ...new Set(
            rows.map((security) => security.asset_class_name).filter(Boolean)
          ),
        ].sort();

        if (classes.length > 0) {
          const firstClass = classes[0];

          setAssetClass(firstClass);
          setAssetClassQuery(firstClass);

          const firstSecurity = rows.find(
            (security) => security.asset_class_name === firstClass
          );

          if (firstSecurity) {
            setSelectedSecurityId(String(firstSecurity.security_id));
          }
        }
      } catch (err) {
        console.error("Error fetching seasonality securities:", err);
        setError("Failed to load seasonality securities.");
      } finally {
        setLoadingSecurities(false);
      }
    };

    fetchSecurities();
  }, []);

  const assetClasses = useMemo(() => {
    return [
      ...new Set(
        securities.map((security) => security.asset_class_name).filter(Boolean)
      ),
    ].sort();
  }, [securities]);

  const filteredAssetClasses = useMemo(() => {
    if (!assetClassTyping) return assetClasses;

    const q = (assetClassQuery || "").trim().toLowerCase();
    if (!q) return assetClasses;

    return assetClasses.filter((item) => item.toLowerCase().includes(q));
  }, [assetClasses, assetClassQuery, assetClassTyping]);

  const filteredSecurities = useMemo(() => {
    if (!assetClass) return [];

    return securities.filter(
      (security) => security.asset_class_name === assetClass
    );
  }, [securities, assetClass]);

  const selectedSecurity = useMemo(() => {
    return securities.find(
      (security) => String(security.security_id) === String(selectedSecurityId)
    );
  }, [securities, selectedSecurityId]);

  useEffect(() => {
    if (!assetClass) {
      setSelectedSecurityId("");
      setChartData([]);
      return;
    }

    const matchingSecurities = securities.filter(
      (security) => security.asset_class_name === assetClass
    );

    if (
      matchingSecurities.length > 0 &&
      !matchingSecurities.some(
        (security) => String(security.security_id) === String(selectedSecurityId)
      )
    ) {
      setSelectedSecurityId(String(matchingSecurities[0].security_id));
    }
  }, [assetClass, securities, selectedSecurityId]);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!selectedSecurityId) {
        setChartData([]);
        return;
      }

      try {
        setLoadingChart(true);
        setError("");

        const response = await axios.get(
          `${API_URL}/seasonality/${selectedSecurityId}`,
          {
            params: {
              start_date: startDate,
            },
          }
        );

        setChartData(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Error fetching seasonality chart:", err);
        setError("Failed to load seasonality chart.");
        setChartData([]);
      } finally {
        setLoadingChart(false);
      }
    };

    fetchChartData();
  }, [selectedSecurityId, startDate]);

  useEffect(() => {
    if (!chartScrollRef.current) return;
    if (window.innerWidth > 650) return;
    if (!chartData.length) return;

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
  }, [chartData.length, selectedSecurityId, startDate]);

  const chartStats = useMemo(() => {
    if (!chartData.length) return null;

    const seasonalValues = chartData
      .map((row) => Number(row.seasonal_index_base_100))
      .filter((value) => Number.isFinite(value));

    const returnValues = chartData
      .map((row) => Number(row.avg_daily_ret_pct))
      .filter((value) => Number.isFinite(value));

    if (!seasonalValues.length) return null;

    return {
      maxSeasonal: Math.max(...seasonalValues).toFixed(2),
      minSeasonal: Math.min(...seasonalValues).toFixed(2),
      maxReturn: returnValues.length ? Math.max(...returnValues).toFixed(3) : "-",
      minReturn: returnValues.length ? Math.min(...returnValues).toFixed(3) : "-",
    };
  }, [chartData]);

  const lineData = useMemo(() => {
    return {
      labels: chartData.map((row) => formatDateLabel(row.calendar_date)),
      datasets: [
        {
          label: "Seasonality Index",
          data: chartData.map((row) => Number(row.seasonal_index_base_100)),
          borderColor: "#0f766e",
          backgroundColor: "rgba(15, 118, 110, 0.08)",
          borderWidth: 1.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHitRadius: 12,
          tension: 0.28,
          fill: true,
          spanGaps: true,
        },
      ],
    };
  }, [chartData]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 260,
        easing: "easeOutQuart",
      },
      interaction: {
        mode: "index",
        intersect: false,
      },
      layout: {
        padding: {
          top: 10,
          right: 14,
          bottom: 4,
          left: 8,
        },
      },
      plugins: {
        legend: {
          display: true,
          align: "start",
          labels: {
            color: "#0f766e",
            usePointStyle: true,
            pointStyle: "line",
            boxWidth: 30,
            boxHeight: 8,
            padding: 18,
            font: {
              size: 12,
              weight: "600",
            },
          },
        },
        title: {
          display: false,
        },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#123c36",
          bodyColor: "#123c36",
          borderColor: "rgba(15, 118, 110, 0.18)",
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: (items) => {
              if (!items.length) return "";
              return items[0].label;
            },
            label: function (context) {
              return `Seasonality Index: ${Number(context.raw).toFixed(2)}`;
            },
            afterLabel: function (context) {
              const idx = context.dataIndex;
              const row = chartData[idx];

              if (!row) return "";

              return `Avg Daily Return: ${Number(row.avg_daily_ret_pct).toFixed(3)}%`;
            },
          },
        },
      },
      scales: {
        x: {
          border: {
            display: false,
          },
          title: {
            display: true,
            text: "Calendar Date",
            color: "#0f766e",
            font: {
              size: 12,
              weight: "600",
            },
          },
          ticks: {
            color: "#0f766e",
            maxTicksLimit: 12,
            autoSkip: true,
            maxRotation: 0,
            minRotation: 0,
            font: {
              size: 11,
              weight: "500",
            },
          },
          grid: {
            color: "rgba(15, 118, 110, 0.08)",
            drawBorder: false,
          },
        },
        y: {
          border: {
            display: false,
          },
          title: {
            display: true,
            text: "Seasonality Index (Base 100)",
            color: "#0f766e",
            font: {
              size: 12,
              weight: "600",
            },
          },
          ticks: {
            color: "#0f766e",
            font: {
              size: 11,
              weight: "500",
            },
            callback: function (value) {
              return Number(value).toFixed(0);
            },
          },
          grid: {
            color: "rgba(15, 118, 110, 0.08)",
            drawBorder: false,
          },
        },
      },
    };
  }, [chartData]);

  const pickAssetClass = (item) => {
    setAssetClass(item);
    setAssetClassQuery(item);
    setAssetClassTyping(false);
    setAssetClassOpen(false);
  };

  const handleSecuritySelect = (securityId) => {
    setSelectedSecurityId(String(securityId));
  };

  const AssetClassDropdown = ({ open, items }) => {
    if (!open) return null;

    return (
      <div className="seasonality-dd">
        {items.length === 0 ? (
          <div className="seasonality-dd-empty">No matches</div>
        ) : (
          items.map((item) => (
            <button
              key={item}
              className="seasonality-dd-item"
              type="button"
              onClick={() => pickAssetClass(item)}
            >
              <div className="seasonality-dd-main">{item}</div>
            </button>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="seasonality-container">
      <aside className="seasonality-sidebar">
        <div className="seasonality-sidebarScroll seasonality-desktop-sidebarScroll">
          <div className="seasonality-sidebar-top">
            <h2 className="seasonality-sidebar-title">Seasonality</h2>
            <div className="seasonality-sidebar-subtitle">
              Pick an asset class, security, and start date.
            </div>
          </div>

          <div className="seasonality-control" ref={assetClassRef}>
            <label>Asset Class</label>

            <div className="seasonality-dd-inputWrap">
              <input
                className="seasonality-input seasonality-dd-input"
                value={assetClassQuery}
                placeholder="Select / type to search…"
                onChange={(e) => {
                  setAssetClassTyping(true);
                  setAssetClassQuery(e.target.value);
                  setAssetClassOpen(true);
                }}
                onFocus={(e) => {
                  e.target.select();
                  setAssetClassTyping(false);
                  setAssetClassOpen(true);
                }}
                onClick={(e) => {
                  e.target.select();
                  setAssetClassTyping(false);
                  setAssetClassOpen(true);
                }}
              />

              <button
                type="button"
                className="seasonality-dd-toggle"
                onClick={() => {
                  setAssetClassTyping(false);
                  setAssetClassOpen((prev) => !prev);
                }}
                aria-label="Toggle Asset Class dropdown"
              >
                ▾
              </button>
            </div>

            <AssetClassDropdown
              open={assetClassOpen}
              items={filteredAssetClasses}
            />
          </div>

          <div className="seasonality-control">
            <label>Start Date</label>

            <input
              className="seasonality-input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="seasonality-sidebar-section">
            <h3 className="seasonality-sidebar-subtitle seasonality-sidebar-subtitle-spaced">
              Securities
            </h3>

            {loadingSecurities ? (
              <div className="seasonality-empty-item">Loading securities...</div>
            ) : filteredSecurities.length > 0 ? (
              <ul className="seasonality-point-list">
                {filteredSecurities.map((security) => (
                  <li
                    key={security.security_id}
                    className={`seasonality-point-item ${
                      String(selectedSecurityId) === String(security.security_id)
                        ? "seasonality-selected-point"
                        : ""
                    }`}
                    onClick={() => handleSecuritySelect(security.security_id)}
                  >
                    <div className="seasonality-point-name">
                      {security.security_long_name}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="seasonality-empty-item">
                Select an asset class to view securities.
              </div>
            )}
          </div>

          {error ? <div className="seasonality-error-box">{error}</div> : null}
        </div>

        <div className="seasonality-mobile-controls">
          <div className="seasonality-mobile-card">
            <div className="seasonality-mobile-section">
              <div className="seasonality-mobile-label">Asset Class</div>

              <select
                className="seasonality-mobile-select"
                value={assetClass}
                onChange={(e) => pickAssetClass(e.target.value)}
              >
                {assetClasses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="seasonality-mobile-section">
              <div className="seasonality-mobile-label">Security</div>

              <select
                className="seasonality-mobile-select"
                value={selectedSecurityId}
                onChange={(e) => handleSecuritySelect(e.target.value)}
              >
                {filteredSecurities.map((security) => (
                  <option key={security.security_id} value={security.security_id}>
                    {security.security_long_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="seasonality-mobile-section">
              <div className="seasonality-mobile-label">Start Date</div>

              <input
                className="seasonality-mobile-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {error ? <div className="seasonality-mobile-error">{error}</div> : null}
          </div>
        </div>
      </aside>

      <main className="seasonality-main">
        <h1 className="seasonality-title">
          {selectedSecurity?.security_long_name || "Seasonality"}
        </h1>

        {chartStats && (
          <div className="seasonality-stats-row">
            <div className="seasonality-stat-card">
              <span className="seasonality-stat-label">Peak Index</span>
              <span className="seasonality-stat-value">
                {chartStats.maxSeasonal}
              </span>
            </div>

            <div className="seasonality-stat-card">
              <span className="seasonality-stat-label">Trough Index</span>
              <span className="seasonality-stat-value">
                {chartStats.minSeasonal}
              </span>
            </div>

            <div className="seasonality-stat-card">
              <span className="seasonality-stat-label">Best Avg Day</span>
              <span className="seasonality-stat-value">
                {chartStats.maxReturn}%
              </span>
            </div>

            <div className="seasonality-stat-card">
              <span className="seasonality-stat-label">Worst Avg Day</span>
              <span className="seasonality-stat-value">
                {chartStats.minReturn}%
              </span>
            </div>
          </div>
        )}

        {loadingChart ? (
          <div className="seasonality-empty-state">
            <p>Loading chart...</p>
          </div>
        ) : chartData.length > 0 ? (
          <section className="seasonality-chart-card">
            <div className="seasonality-chart-header">
              <div>
                <div className="seasonality-chart-kicker">
                  Seasonality Curve
                </div>
                <div className="seasonality-chart-name">
                  {selectedSecurity?.security_long_name}
                </div>
              </div>
            </div>

            <div className="seasonality-chart-scroll-hint">
              Swipe sideways to view the full chart
            </div>

            <div className="seasonality-chart-scroll-area" ref={chartScrollRef}>
              <div className="seasonality-chart-canvas">
                <Line data={lineData} options={options} />
              </div>
            </div>
          </section>
        ) : (
          <div className="seasonality-empty-state">
            <p>Select an asset class and security to view the chart.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Seasonality;