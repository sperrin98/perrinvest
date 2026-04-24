import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
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
import "./Volatility.css";

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
const RANGE_PRESETS = ["1Y", "3Y", "5Y", "10Y", "MAX"];

const formatDateYYYYMMDD = (dateStr) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toISOString().split("T")[0];
};

const formatDateLabel = (dateString) => {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
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
  };

  const years = yearsMap[preset];
  if (!years) return minDate;

  const shifted = shiftYears(maxDate, years);
  return clampStartDate(shifted, minDate, maxDate);
};

const normalizePriceHistoryRows = (rows) => {
  const input = Array.isArray(rows) ? rows : [];
  const out = [];

  for (const row of input) {
    if (Array.isArray(row)) {
      const priceDate = row[1];
      const price = row[2];
      const vol90 = row[6];

      if (priceDate != null) {
        const normalizedDate = formatDateYYYYMMDD(priceDate);
        const parsedPrice = price != null ? Number(price) : null;
        const parsedVol = vol90 != null ? Number(vol90) : null;

        out.push({
          price_date: normalizedDate,
          price: Number.isFinite(parsedPrice) ? parsedPrice : null,
          VOL_90d: Number.isFinite(parsedVol) ? parsedVol : null,
        });
      }
    } else if (row && typeof row === "object") {
      const priceDate = row.price_date ?? row.date;
      const price = row.price ?? row.close ?? null;
      const vol90 = row.VOL_90d ?? row.vol_90d ?? row.vol90 ?? null;

      if (priceDate != null) {
        const normalizedDate = formatDateYYYYMMDD(priceDate);
        const parsedPrice = price != null ? Number(price) : null;
        const parsedVol = vol90 != null ? Number(vol90) : null;

        out.push({
          price_date: normalizedDate,
          price: Number.isFinite(parsedPrice) ? parsedPrice : null,
          VOL_90d: Number.isFinite(parsedVol) ? parsedVol : null,
        });
      }
    }
  }

  return out
    .filter((row) => row.price_date)
    .sort((a, b) => new Date(a.price_date) - new Date(b.price_date));
};

function Volatility() {
  const [securities, setSecurities] = useState([]);
  const [loadingSecurities, setLoadingSecurities] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [error, setError] = useState("");

  const [assetClass, setAssetClass] = useState("");
  const [assetClassQuery, setAssetClassQuery] = useState("");
  const [assetClassOpen, setAssetClassOpen] = useState(false);
  const [assetClassTyping, setAssetClassTyping] = useState(false);

  const [selectedSecurityId, setSelectedSecurityId] = useState("");
  const [priceRows, setPriceRows] = useState([]);

  const [selectedRangePreset, setSelectedRangePreset] = useState("MAX");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [activeStartDate, setActiveStartDate] = useState("");
  const [activeEndDate, setActiveEndDate] = useState("");

  const assetClassRef = useRef(null);
  const priceChartScrollRef = useRef(null);
  const volChartScrollRef = useRef(null);

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
        console.error("Error fetching volatility securities:", err);
        setError("Failed to load securities.");
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
      setPriceRows([]);
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
    const fetchPriceHistory = async () => {
      if (!selectedSecurityId) {
        setPriceRows([]);
        return;
      }

      try {
        setLoadingCharts(true);
        setError("");

        const response = await axios.get(
          `${API_URL}/securities/${selectedSecurityId}/price-histories`
        );

        const cleaned = normalizePriceHistoryRows(response.data);
        setPriceRows(cleaned);
      } catch (err) {
        console.error("Error fetching volatility data:", err);
        setError("Failed to load price history.");
        setPriceRows([]);
      } finally {
        setLoadingCharts(false);
      }
    };

    fetchPriceHistory();
  }, [selectedSecurityId]);

  useEffect(() => {
    if (!priceRows.length) return;

    const minDate = priceRows[0].price_date;
    const maxDate = priceRows[priceRows.length - 1].price_date;

    setSelectedRangePreset("MAX");
    setActiveStartDate(minDate);
    setActiveEndDate(maxDate);
    setCustomStartDate(minDate);
    setCustomEndDate(maxDate);
  }, [priceRows]);

  const filteredPriceRows = useMemo(() => {
    if (!priceRows.length || !activeStartDate || !activeEndDate) return [];

    return priceRows.filter(
      (row) => row.price_date >= activeStartDate && row.price_date <= activeEndDate
    );
  }, [priceRows, activeStartDate, activeEndDate]);

  useEffect(() => {
    if (window.innerWidth > 650) return;
    if (!filteredPriceRows.length) return;

    const scrollToEnd = (ref) => {
      if (!ref.current) return;

      ref.current.scrollLeft = ref.current.scrollWidth - ref.current.clientWidth;
    };

    requestAnimationFrame(() => {
      scrollToEnd(priceChartScrollRef);
      scrollToEnd(volChartScrollRef);

      setTimeout(() => {
        scrollToEnd(priceChartScrollRef);
        scrollToEnd(volChartScrollRef);
      }, 50);

      setTimeout(() => {
        scrollToEnd(priceChartScrollRef);
        scrollToEnd(volChartScrollRef);
      }, 150);

      setTimeout(() => {
        scrollToEnd(priceChartScrollRef);
        scrollToEnd(volChartScrollRef);
      }, 300);
    });
  }, [
    selectedSecurityId,
    selectedRangePreset,
    filteredPriceRows.length,
    activeStartDate,
    activeEndDate,
  ]);

  const handlePresetRange = (preset) => {
    if (!priceRows.length) return;

    const minDate = priceRows[0].price_date;
    const maxDate = priceRows[priceRows.length - 1].price_date;
    const newStart = getPresetStartDate(preset, maxDate, minDate);

    setSelectedRangePreset(preset);
    setActiveStartDate(newStart);
    setActiveEndDate(maxDate);
    setCustomStartDate(newStart);
    setCustomEndDate(maxDate);
  };

  const handleApplyCustomRange = () => {
    if (!priceRows.length) return;

    const minDate = priceRows[0].price_date;
    const maxDate = priceRows[priceRows.length - 1].price_date;

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

  const stats = useMemo(() => {
    if (!filteredPriceRows.length) return null;

    const prices = filteredPriceRows
      .map((row) => row.price)
      .filter((value) => Number.isFinite(value));

    const vols = filteredPriceRows
      .map((row) => row.VOL_90d)
      .filter((value) => Number.isFinite(value));

    if (!prices.length && !vols.length) return null;

    return {
      latestPrice: prices.length ? prices[prices.length - 1].toFixed(2) : "-",
      maxPrice: prices.length ? Math.max(...prices).toFixed(2) : "-",
      latestVol: vols.length ? vols[vols.length - 1].toFixed(4) : "-",
      maxVol: vols.length ? Math.max(...vols).toFixed(4) : "-",
    };
  }, [filteredPriceRows]);

  const priceChartData = useMemo(() => {
    return {
      labels: filteredPriceRows.map((row) => formatDateLabel(row.price_date)),
      datasets: [
        {
          label: "Price",
          data: filteredPriceRows.map((row) => row.price),
          borderColor: "#e84d4d",
          backgroundColor: "rgba(232, 77, 77, 0.08)",
          borderWidth: 1.2,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHitRadius: 10,
          tension: 0.15,
          fill: true,
          spanGaps: true,
        },
      ],
    };
  }, [filteredPriceRows]);

  const volChartData = useMemo(() => {
    return {
      labels: filteredPriceRows.map((row) => formatDateLabel(row.price_date)),
      datasets: [
        {
          label: "90 Day Volatility",
          data: filteredPriceRows.map((row) => row.VOL_90d),
          borderColor: "#0f766e",
          backgroundColor: "rgba(15, 118, 110, 0.08)",
          borderWidth: 1.2,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHitRadius: 10,
          tension: 0.15,
          fill: true,
          spanGaps: true,
        },
      ],
    };
  }, [filteredPriceRows]);

  const commonOptions = useMemo(() => {
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
        },
      },
      scales: {
        x: {
          border: {
            display: false,
          },
          ticks: {
            color: "#0f766e",
            maxTicksLimit: 10,
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
      },
    };
  }, []);

  const priceOptions = useMemo(() => {
    return {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        tooltip: {
          ...commonOptions.plugins.tooltip,
          callbacks: {
            title: (items) => (items.length ? items[0].label : ""),
            label: (context) => `Price: ${Number(context.raw).toFixed(2)}`,
          },
        },
      },
      scales: {
        ...commonOptions.scales,
        y: {
          border: {
            display: false,
          },
          title: {
            display: true,
            text: "Price",
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
          },
          grid: {
            color: "rgba(15, 118, 110, 0.08)",
            drawBorder: false,
          },
        },
      },
    };
  }, [commonOptions]);

  const volOptions = useMemo(() => {
    return {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        tooltip: {
          ...commonOptions.plugins.tooltip,
          callbacks: {
            title: (items) => (items.length ? items[0].label : ""),
            label: (context) =>
              `90 Day Volatility: ${Number(context.raw).toFixed(4)}`,
          },
        },
      },
      scales: {
        ...commonOptions.scales,
        y: {
          border: {
            display: false,
          },
          title: {
            display: true,
            text: "Volatility",
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
              return Number(value).toFixed(2);
            },
          },
          grid: {
            color: "rgba(15, 118, 110, 0.08)",
            drawBorder: false,
          },
        },
      },
    };
  }, [commonOptions]);

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
      <div className="volatility-dd">
        {items.length === 0 ? (
          <div className="volatility-dd-empty">No matches</div>
        ) : (
          items.map((item) => (
            <button
              key={item}
              className="volatility-dd-item"
              type="button"
              onClick={() => pickAssetClass(item)}
            >
              <div className="volatility-dd-main">{item}</div>
            </button>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="volatility-container">
      <aside className="volatility-sidebar">
        <div className="volatility-miniRail" aria-label="Range selector">
          {RANGE_PRESETS.map((range) => (
            <button
              key={range}
              type="button"
              className={`volatility-chip ${
                selectedRangePreset === range ? "volatility-chip-active" : ""
              }`}
              onClick={() => handlePresetRange(range)}
              title={range}
            >
              {range}
            </button>
          ))}
        </div>

        <div className="volatility-sidebarScroll volatility-desktop-sidebarScroll">
          <div className="volatility-sidebar-top">
            <h2 className="volatility-sidebar-title">Volatility</h2>
            <div className="volatility-sidebar-subtitle">
              Pick an asset class and security.
            </div>
          </div>

          <div className="volatility-control" ref={assetClassRef}>
            <label>Asset Class</label>

            <div className="volatility-dd-inputWrap">
              <input
                className="volatility-input volatility-dd-input"
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
                className="volatility-dd-toggle"
                onClick={() => {
                  setAssetClassTyping(false);
                  setAssetClassOpen((p) => !p);
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

          <div className="volatility-sidebar-section">
            <h3 className="volatility-sidebar-subtitle volatility-sidebar-subtitle-spaced">
              Securities
            </h3>

            {loadingSecurities ? (
              <div className="volatility-empty-item">Loading securities...</div>
            ) : filteredSecurities.length > 0 ? (
              <ul className="volatility-point-list">
                {filteredSecurities.map((security) => (
                  <li
                    key={security.security_id}
                    className={`volatility-point-item ${
                      String(selectedSecurityId) === String(security.security_id)
                        ? "volatility-selected-point"
                        : ""
                    }`}
                    onClick={() => handleSecuritySelect(security.security_id)}
                  >
                    <div className="volatility-point-name">
                      {security.security_long_name}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="volatility-empty-item">
                Select an asset class to view securities.
              </div>
            )}
          </div>

          <div className="volatility-sidebar-section">
            <h3 className="volatility-sidebar-subtitle volatility-sidebar-subtitle-spaced">
              Custom Range
            </h3>

            <div className="volatility-date-control">
              <label htmlFor="vol-start-date-desktop">Start</label>
              <input
                id="vol-start-date-desktop"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>

            <div className="volatility-date-control">
              <label htmlFor="vol-end-date-desktop">End</label>
              <input
                id="vol-end-date-desktop"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="volatility-apply-range-btn"
              onClick={handleApplyCustomRange}
            >
              Apply Range
            </button>
          </div>

          {error ? <div className="volatility-error-box">{error}</div> : null}
        </div>

        <div className="volatility-mobile-controls">
          <div className="volatility-mobile-card">
            <div className="volatility-mobile-section">
              <div className="volatility-mobile-label">Asset Class</div>

              <select
                className="volatility-mobile-select"
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

            <div className="volatility-mobile-section">
              <div className="volatility-mobile-label">Security</div>

              <select
                className="volatility-mobile-select"
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

            <div className="volatility-mobile-section">
              <div className="volatility-mobile-label">Range</div>

              <div className="volatility-mobile-range-bar">
                {RANGE_PRESETS.map((range) => (
                  <button
                    key={range}
                    type="button"
                    className={`volatility-mobile-chip ${
                      selectedRangePreset === range
                        ? "volatility-mobile-chip-active"
                        : ""
                    }`}
                    onClick={() => handlePresetRange(range)}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div className="volatility-mobile-grid">
              <div className="volatility-mobile-section">
                <div className="volatility-mobile-label">Start</div>
                <input
                  type="date"
                  className="volatility-mobile-input"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>

              <div className="volatility-mobile-section">
                <div className="volatility-mobile-label">End</div>
                <input
                  type="date"
                  className="volatility-mobile-input"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              className="volatility-mobile-apply"
              onClick={handleApplyCustomRange}
            >
              Apply Range
            </button>

            {error ? <div className="volatility-mobile-error">{error}</div> : null}
          </div>
        </div>
      </aside>

      <main className="volatility-main">
        <h1 className="volatility-title">
          {selectedSecurity?.security_long_name || "Volatility"}
        </h1>

        {stats && (
          <div className="volatility-stats-row">
            <div className="volatility-stat-card">
              <span className="volatility-stat-label">Latest Price</span>
              <span className="volatility-stat-value">{stats.latestPrice}</span>
            </div>

            <div className="volatility-stat-card">
              <span className="volatility-stat-label">Peak Price</span>
              <span className="volatility-stat-value">{stats.maxPrice}</span>
            </div>

            <div className="volatility-stat-card">
              <span className="volatility-stat-label">Latest 90D Vol</span>
              <span className="volatility-stat-value">{stats.latestVol}</span>
            </div>

            <div className="volatility-stat-card">
              <span className="volatility-stat-label">Peak 90D Vol</span>
              <span className="volatility-stat-value">{stats.maxVol}</span>
            </div>
          </div>
        )}

        {loadingCharts ? (
          <div className="volatility-empty-state">
            <p>Loading charts...</p>
          </div>
        ) : filteredPriceRows.length > 0 ? (
          <div className="volatility-charts">
            <section className="volatility-chart-card volatility-chart-card--price">
              <div className="volatility-chart-header">
                <div>
                  <div className="volatility-chart-kicker">Price History</div>
                  <div className="volatility-chart-name">
                    {selectedSecurity?.security_long_name}
                  </div>
                </div>
              </div>

              <div className="volatility-chart-scroll-hint">
                Swipe sideways to view the full chart
              </div>

              <div
                className="volatility-chart-scroll-area"
                ref={priceChartScrollRef}
              >
                <div className="volatility-chart-canvas volatility-chart-canvas--price">
                  <Line data={priceChartData} options={priceOptions} />
                </div>
              </div>
            </section>

            <section className="volatility-chart-card volatility-chart-card--vol">
              <div className="volatility-chart-header">
                <div>
                  <div className="volatility-chart-kicker">Volatility</div>
                  <div className="volatility-chart-name">90 Day Volatility</div>
                </div>
              </div>

              <div className="volatility-chart-scroll-hint">
                Swipe sideways to view the full chart
              </div>

              <div
                className="volatility-chart-scroll-area"
                ref={volChartScrollRef}
              >
                <div className="volatility-chart-canvas volatility-chart-canvas--vol">
                  <Line data={volChartData} options={volOptions} />
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="volatility-empty-state">
            <p>Select an asset class and security to view the charts.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Volatility;