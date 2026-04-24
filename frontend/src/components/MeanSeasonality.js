// MeanSeasonality.js

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import "./MeanSeasonality.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
);

const API_URL = process.env.REACT_APP_API_URL;

const msxSecurityLabel = (security) => {
  if (!security) return "";
  return (
    security.security_long_name ||
    security.security_short_name ||
    security.ticker ||
    ""
  );
};

function MsxSecurityDropdown({
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
      const name = (item.security_long_name || "").toLowerCase();
      const shortName = (item.security_short_name || "").toLowerCase();
      const ticker = (item.ticker || "").toLowerCase();

      return name.includes(q) || shortName.includes(q) || ticker.includes(q);
    });
  }, [items, query]);

  return (
    <div className="msx-control" ref={refProp}>
      <label>Commodity</label>

      <div className="msx-dd-inputWrap">
        <input
          className="msx-input msx-dd-input"
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
          className="msx-dd-toggle"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle commodity dropdown"
        >
          ▾
        </button>
      </div>

      {open && (
        <div className="msx-dd">
          {filtered.length === 0 ? (
            <div className="msx-dd-empty">No matches</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.security_id}
                className="msx-dd-item"
                type="button"
                onClick={() => onPick(item)}
              >
                <div className="msx-dd-main">{item.security_long_name}</div>

                <div className="msx-dd-sub">
                  {item.security_short_name || item.asset_class_name || ""}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function MeanSeasonality() {
  const [securities, setSecurities] = useState([]);
  const [loadingSecurities, setLoadingSecurities] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState("");

  const [selectedSecurity, setSelectedSecurity] = useState(null);
  const [securityQuery, setSecurityQuery] = useState("");
  const [securityOpen, setSecurityOpen] = useState(false);
  const [rows, setRows] = useState([]);

  const securityRef = useRef(null);
  const chartScrollRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (securityRef.current && !securityRef.current.contains(e.target)) {
        setSecurityOpen(false);
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

        const response = await axios.get(`${API_URL}/mean-seasonality/securities`);
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

  useEffect(() => {
    if (!chartScrollRef.current) return;
    if (window.innerWidth > 650) return;
    if (!rows.length) return;

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
  }, [rows.length, selectedSecurity]);

  const fetchMeanSeasonality = async () => {
    if (!selectedSecurity) {
      setError("Please select a commodity.");
      setRows([]);
      return;
    }

    try {
      setLoadingChart(true);
      setError("");

      const response = await axios.get(`${API_URL}/mean-seasonality`, {
        params: {
          security_id: selectedSecurity.security_id,
        },
      });

      const cleaned = (Array.isArray(response.data) ? response.data : [])
        .map((row) => ({
          month_num: row.month_num != null ? Number(row.month_num) : null,
          month_name: row.month_name || "",
          geometric_mean_monthly_return_pct:
            row.geometric_mean_monthly_return_pct != null
              ? Number(row.geometric_mean_monthly_return_pct)
              : null,
          positive_months_pct:
            row.positive_months_pct != null
              ? Number(row.positive_months_pct)
              : null,
        }))
        .filter((row) => Number.isFinite(row.month_num))
        .sort((a, b) => a.month_num - b.month_num);

      setRows(cleaned);
    } catch (err) {
      console.error(err);
      setError("Failed to load mean seasonality data.");
      setRows([]);
    } finally {
      setLoadingChart(false);
    }
  };

  const handleMobileSecurityPick = (securityId) => {
    const picked = securities.find(
      (security) => String(security.security_id) === String(securityId)
    );

    if (!picked) return;

    setSelectedSecurity(picked);
    setSecurityQuery(msxSecurityLabel(picked));
  };

  const statCards = useMemo(() => {
    if (!rows.length) return null;

    const returns = rows
      .map((row) => row.geometric_mean_monthly_return_pct)
      .filter((value) => Number.isFinite(value));

    const hitRates = rows
      .map((row) => row.positive_months_pct)
      .filter((value) => Number.isFinite(value));

    if (!returns.length || !hitRates.length) return null;

    const bestMonth = rows.reduce((best, row) => {
      if (!best) return row;

      return row.geometric_mean_monthly_return_pct >
        best.geometric_mean_monthly_return_pct
        ? row
        : best;
    }, null);

    const worstMonth = rows.reduce((worst, row) => {
      if (!worst) return row;

      return row.geometric_mean_monthly_return_pct <
        worst.geometric_mean_monthly_return_pct
        ? row
        : worst;
    }, null);

    const bestHitRateMonth = rows.reduce((best, row) => {
      if (!best) return row;

      return row.positive_months_pct > best.positive_months_pct ? row : best;
    }, null);

    const avgHitRate =
      hitRates.reduce((sum, value) => sum + value, 0) / hitRates.length;

    return {
      bestMonth,
      worstMonth,
      bestHitRateMonth,
      avgHitRate,
    };
  }, [rows]);

  const chartData = useMemo(() => {
    return {
      labels: rows.map((row) => row.month_name),
      datasets: [
        {
          type: "bar",
          label: "Geometric Mean Monthly Return",
          data: rows.map((row) => row.geometric_mean_monthly_return_pct),
          yAxisID: "y",
          backgroundColor: "rgba(0, 121, 107, 0.50)",
          borderColor: "#00796b",
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.62,
          categoryPercentage: 0.74,
          order: 2,
        },
        {
          type: "line",
          label: "% Positive Months",
          data: rows.map((row) => row.positive_months_pct),
          yAxisID: "y1",
          borderColor: "#e84d4d",
          backgroundColor: "#e84d4d",
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#e84d4d",
          pointBorderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 6,
          borderWidth: 2.5,
          tension: 0.2,
          fill: false,
          order: 1,
        },
      ],
    };
  }, [rows]);

  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#00796b",
            font: {
              size: 12,
              weight: "600",
            },
            boxWidth: 24,
            padding: 16,
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
              const label = context.dataset.label || "";
              const value = context.raw;

              if (value === null || value === undefined) {
                return `${label}: -`;
              }

              return `${label}: ${Number(value).toFixed(2)}%`;
            },
          },
        },
      },
      scales: {
        x: {
          offset: true,
          ticks: {
            color: "#00796b",
            font: {
              size: 12,
            },
          },
          grid: {
            display: false,
          },
          border: {
            color: "rgb(202, 202, 202)",
          },
        },
        y: {
          position: "left",
          ticks: {
            color: "#00796b",
            callback: (value) => `${Number(value).toFixed(1)}%`,
          },
          title: {
            display: true,
            text: "Geometric Mean Return",
            color: "#00796b",
          },
          grid: {
            color: "rgba(0, 0, 0, 0.08)",
          },
          border: {
            color: "rgb(202, 202, 202)",
          },
        },
        y1: {
          position: "right",
          ticks: {
            color: "#e84d4d",
            callback: (value) => `${Number(value).toFixed(0)}%`,
          },
          title: {
            display: true,
            text: "% Positive Months",
            color: "#e84d4d",
          },
          grid: {
            drawOnChartArea: false,
          },
          border: {
            color: "rgb(202, 202, 202)",
          },
        },
      },
    };
  }, []);

  const headingText = selectedSecurity
    ? `${selectedSecurity.security_long_name} Seasonality`
    : "Mean Seasonality";

  return (
    <div className="msx-container">
      <aside className="msx-sidebar">
        <div className="msx-sidebarScroll msx-desktop-sidebarScroll">
          <div className="msx-sidebar-top">
            <h2 className="msx-sidebar-title">Mean Seasonality</h2>
            <div className="msx-sidebar-subtitle">
              Monthly geometric mean return and percentage of positive months.
            </div>
          </div>

          {loadingSecurities ? (
            <div className="msx-hint">Loading commodities…</div>
          ) : null}

          {error ? <div className="msx-error">{error}</div> : null}

          <MsxSecurityDropdown
            query={securityQuery}
            setQuery={setSecurityQuery}
            open={securityOpen}
            setOpen={setSecurityOpen}
            refProp={securityRef}
            items={securities}
            onPick={(item) => {
              setSelectedSecurity(item);
              setSecurityQuery(msxSecurityLabel(item));
              setSecurityOpen(false);
            }}
          />

          <button
            className="msx-load-btn"
            onClick={fetchMeanSeasonality}
            type="button"
            disabled={loadingChart}
          >
            {loadingChart ? "Loading..." : "Load Chart"}
          </button>
        </div>

        <div className="msx-mobile-controls">
          <div className="msx-mobile-card">
            {loadingSecurities ? (
              <div className="msx-mobile-hint">Loading commodities…</div>
            ) : null}

            <div className="msx-mobile-section">
              <div className="msx-mobile-label">Commodity</div>

              <select
                className="msx-mobile-select"
                value={selectedSecurity?.security_id || ""}
                onChange={(e) => handleMobileSecurityPick(e.target.value)}
              >
                <option value="">Select...</option>

                {securities.map((security) => (
                  <option key={security.security_id} value={security.security_id}>
                    {msxSecurityLabel(security)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="msx-mobile-load"
              onClick={fetchMeanSeasonality}
              disabled={loadingChart}
            >
              {loadingChart ? "Loading..." : "Load Chart"}
            </button>

            {error ? <div className="msx-mobile-error">{error}</div> : null}
          </div>
        </div>
      </aside>

      <main className="msx-main">
        <h1 className="msx-title">{headingText}</h1>

        {selectedSecurity && (
          <div className="msx-subtitle-row">
            Geometric Mean Monthly Return and % Positive Months
          </div>
        )}

        {statCards && (
          <div className="msx-stats-row">
            <div className="msx-stat-card">
              <span className="msx-stat-label">Best Month</span>
              <span className="msx-stat-value">
                {statCards.bestMonth?.month_name || "-"}
              </span>
              <span className="msx-stat-sub">
                {Number.isFinite(
                  statCards.bestMonth?.geometric_mean_monthly_return_pct
                )
                  ? `${statCards.bestMonth.geometric_mean_monthly_return_pct.toFixed(
                      2
                    )}% return`
                  : "-"}
              </span>
            </div>

            <div className="msx-stat-card">
              <span className="msx-stat-label">Worst Month</span>
              <span className="msx-stat-value">
                {statCards.worstMonth?.month_name || "-"}
              </span>
              <span className="msx-stat-sub">
                {Number.isFinite(
                  statCards.worstMonth?.geometric_mean_monthly_return_pct
                )
                  ? `${statCards.worstMonth.geometric_mean_monthly_return_pct.toFixed(
                      2
                    )}% return`
                  : "-"}
              </span>
            </div>

            <div className="msx-stat-card">
              <span className="msx-stat-label">Best Hit Rate</span>
              <span className="msx-stat-value">
                {statCards.bestHitRateMonth?.month_name || "-"}
              </span>
              <span className="msx-stat-sub">
                {Number.isFinite(statCards.bestHitRateMonth?.positive_months_pct)
                  ? `${statCards.bestHitRateMonth.positive_months_pct.toFixed(
                      1
                    )}% positive`
                  : "-"}
              </span>
            </div>

            <div className="msx-stat-card">
              <span className="msx-stat-label">Avg Hit Rate</span>
              <span className="msx-stat-value">
                {Number.isFinite(statCards.avgHitRate)
                  ? `${statCards.avgHitRate.toFixed(1)}%`
                  : "-"}
              </span>
              <span className="msx-stat-sub">All months</span>
            </div>
          </div>
        )}

        {loadingChart ? (
          <div className="msx-empty-state">
            <p>Loading chart...</p>
          </div>
        ) : rows.length > 0 ? (
          <section className="msx-chart-card">
            <div className="msx-chart-header">
              <div>
                <div className="msx-chart-kicker">Mean Seasonality</div>
                <div className="msx-chart-name">
                  {selectedSecurity?.security_long_name}
                </div>
              </div>
            </div>

            <div className="msx-chart-scroll-hint">
              Swipe sideways to view the full chart
            </div>

            <div className="msx-chart-scroll-area" ref={chartScrollRef}>
              <div className="msx-chart-canvas">
                <Chart type="bar" data={chartData} options={chartOptions} />
              </div>
            </div>
          </section>
        ) : (
          <div className="msx-empty-state">
            <p>Select a commodity and load the chart.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default MeanSeasonality;