// Correlations.js

import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Correlations.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const formatDateYYYYMMDD = (dateStr) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
};

const normalizePriceHistory = (raw) => {
  const rows = Array.isArray(raw) ? raw : [];
  const out = [];

  for (const row of rows) {
    if (Array.isArray(row)) {
      const dateVal = row[1];
      const priceVal = row[2];

      if (dateVal != null && priceVal != null) {
        const date = formatDateYYYYMMDD(dateVal);
        const price = Number(priceVal);

        if (!Number.isNaN(price)) {
          out.push({ date, price });
        }
      }
    } else if (row && typeof row === "object") {
      const dateVal = row.price_date ?? row.date;
      const priceVal = row.price ?? row.close ?? row.value;

      if (dateVal != null && priceVal != null) {
        const date = formatDateYYYYMMDD(dateVal);
        const price = Number(priceVal);

        if (!Number.isNaN(price)) {
          out.push({ date, price });
        }
      }
    }
  }

  out.sort((a, b) => new Date(a.date) - new Date(b.date));
  return out;
};

function Correlations() {
  const apiBase = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

  const [securities, setSecurities] = useState([]);
  const [secLoading, setSecLoading] = useState(false);
  const [secError, setSecError] = useState("");

  const [sec1Query, setSec1Query] = useState("");
  const [sec2Query, setSec2Query] = useState("");
  const [sec1Open, setSec1Open] = useState(false);
  const [sec2Open, setSec2Open] = useState(false);

  const [security1, setSecurity1] = useState(null);
  const [security2, setSecurity2] = useState(null);

  const frequencies = useMemo(
    () => [
      { value: "DAILY", label: "DAILY" },
      { value: "WEEKLY", label: "WEEKLY" },
      { value: "MONTHLY", label: "MONTHLY" },
      { value: "QUARTERLY", label: "QUARTERLY" },
    ],
    []
  );

  const ranges = useMemo(
    () => [
      { value: "1Y", label: "1Y" },
      { value: "3Y", label: "3Y" },
      { value: "5Y", label: "5Y" },
      { value: "10Y", label: "10Y" },
      { value: "MAX", label: "MAX" },
    ],
    []
  );

  const [freqQuery, setFreqQuery] = useState("");
  const [freqOpen, setFreqOpen] = useState(false);
  const [frequency, setFrequency] = useState("");
  const [freqTyping, setFreqTyping] = useState(false);

  const [rangeQuery, setRangeQuery] = useState("");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [rangeValue, setRangeValue] = useState("");
  const [rangeTyping, setRangeTyping] = useState(false);

  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [priceSeries, setPriceSeries] = useState([]);
  const [corrSeries, setCorrSeries] = useState([]);

  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sec1Ref = useRef(null);
  const sec2Ref = useRef(null);
  const freqRef = useRef(null);
  const rangeRef = useRef(null);
  const priceScrollRef = useRef(null);
  const corrScrollRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (sec1Ref.current && !sec1Ref.current.contains(e.target)) {
        setSec1Open(false);
      }

      if (sec2Ref.current && !sec2Ref.current.contains(e.target)) {
        setSec2Open(false);
      }

      if (freqRef.current && !freqRef.current.contains(e.target)) {
        setFreqOpen(false);
      }

      if (rangeRef.current && !rangeRef.current.contains(e.target)) {
        setRangeOpen(false);
      }
    };

    document.addEventListener("mousedown", onClick);

    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const fetchSecurities = async () => {
      if (!apiBase) {
        setSecError("REACT_APP_API_URL is missing.");
        return;
      }

      setSecLoading(true);
      setSecError("");

      try {
        const response = await fetch(`${apiBase}/securities?_=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        const text = await response.text();

        let json;

        try {
          json = JSON.parse(text);
        } catch {
          throw new Error(
            `Securities API did not return JSON. First 200 chars: ${text.slice(
              0,
              200
            )}`
          );
        }

        if (!response.ok) {
          throw new Error(
            json?.error || `Failed to load securities (${response.status})`
          );
        }

        setSecurities(Array.isArray(json) ? json : []);
      } catch (e) {
        setSecError(e.message || "Error loading securities");
        setSecurities([]);
      } finally {
        setSecLoading(false);
      }
    };

    fetchSecurities();
  }, [apiBase]);

  useEffect(() => {
    if (window.innerWidth > 650) return;

    const scrollToEnd = (ref) => {
      if (!ref.current) return;

      ref.current.scrollLeft = ref.current.scrollWidth - ref.current.clientWidth;
    };

    if (priceSeries.length) {
      requestAnimationFrame(() => {
        scrollToEnd(priceScrollRef);
        setTimeout(() => scrollToEnd(priceScrollRef), 50);
        setTimeout(() => scrollToEnd(priceScrollRef), 150);
      });
    }

    if (corrSeries.length) {
      requestAnimationFrame(() => {
        scrollToEnd(corrScrollRef);
        setTimeout(() => scrollToEnd(corrScrollRef), 50);
        setTimeout(() => scrollToEnd(corrScrollRef), 150);
      });
    }
  }, [
    priceSeries.length,
    corrSeries.length,
    security1,
    security2,
    frequency,
    rangeValue,
  ]);

  const formatSecurityLabel = (security) => {
    if (!security) return "";

    const name = security.security_long_name || security.name || "";
    const ticker = security.ticker ? ` (${security.ticker})` : "";

    return `${name}${ticker}`;
  };

  const filteredSec1 = useMemo(() => {
    const q = (sec1Query || "").trim().toLowerCase();

    if (!q) return securities;

    return securities.filter((security) => {
      const name = (security.security_long_name || "").toLowerCase();
      const ticker = (security.ticker || "").toLowerCase();

      return name.includes(q) || ticker.includes(q);
    });
  }, [securities, sec1Query]);

  const filteredSec2 = useMemo(() => {
    const q = (sec2Query || "").trim().toLowerCase();

    if (!q) return securities;

    return securities.filter((security) => {
      const name = (security.security_long_name || "").toLowerCase();
      const ticker = (security.ticker || "").toLowerCase();

      return name.includes(q) || ticker.includes(q);
    });
  }, [securities, sec2Query]);

  const filteredFreq = useMemo(() => {
    if (!freqTyping) return frequencies;

    const q = (freqQuery || "").trim().toUpperCase();
    if (!q) return frequencies;

    return frequencies.filter((item) => item.label.includes(q));
  }, [frequencies, freqQuery, freqTyping]);

  const filteredRange = useMemo(() => {
    if (!rangeTyping) return ranges;

    const q = (rangeQuery || "").trim().toUpperCase();
    if (!q) return ranges;

    return ranges.filter((item) => item.label.includes(q));
  }, [ranges, rangeQuery, rangeTyping]);

  const pickSecurity1 = (security) => {
    setSecurity1(security);
    setSec1Query(formatSecurityLabel(security));
    setSec1Open(false);
  };

  const pickSecurity2 = (security) => {
    setSecurity2(security);
    setSec2Query(formatSecurityLabel(security));
    setSec2Open(false);
  };

  const pickFrequency = (item) => {
    setFrequency(item.value);
    setFreqQuery(item.label);
    setFreqTyping(false);
    setFreqOpen(false);
  };

  const pickRange = (item) => {
    setRangeValue(item.value);
    setRangeQuery(item.label);
    setRangeTyping(false);
    setRangeOpen(false);
  };

  const fetchAll = async () => {
    setHasLoaded(true);
    setError("");
    setPriceSeries([]);
    setCorrSeries([]);

    if (!apiBase) {
      setError("REACT_APP_API_URL is missing.");
      return;
    }

    if (!security1?.security_id || !security2?.security_id) {
      setError("Pick two securities first.");
      return;
    }

    if (!frequency) {
      setError("Pick a frequency.");
      return;
    }

    if (!rangeValue) {
      setError("Pick a range.");
      return;
    }

    if (!endDate) {
      setError("Pick an end date.");
      return;
    }

    setLoading(true);

    try {
      const id1 = security1.security_id;
      const id2 = security2.security_id;

      const priceUrl1 = `${apiBase}/securities/${id1}/price-histories?_=${Date.now()}`;
      const priceUrl2 = `${apiBase}/securities/${id2}/price-histories?_=${Date.now()}`;

      const corrParams = new URLSearchParams({
        security_id_1: String(id1),
        security_id_2: String(id2),
        frequency,
        range: rangeValue,
        end_date: endDate,
      });

      const corrUrl = `${apiBase}/rolling-corr?${corrParams.toString()}&_=${Date.now()}`;

      const [resP1, resP2, resC] = await Promise.all([
        fetch(priceUrl1, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        }),
        fetch(priceUrl2, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        }),
        fetch(corrUrl, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        }),
      ]);

      const [txtP1, txtP2, txtC] = await Promise.all([
        resP1.text(),
        resP2.text(),
        resC.text(),
      ]);

      let jsonP1;
      let jsonP2;
      let jsonC;

      try {
        jsonP1 = JSON.parse(txtP1);
      } catch {
        throw new Error(`Price A not JSON. First 200: ${txtP1.slice(0, 200)}`);
      }

      try {
        jsonP2 = JSON.parse(txtP2);
      } catch {
        throw new Error(`Price B not JSON. First 200: ${txtP2.slice(0, 200)}`);
      }

      try {
        jsonC = JSON.parse(txtC);
      } catch {
        throw new Error(`Corr not JSON. First 200: ${txtC.slice(0, 200)}`);
      }

      if (!resP1.ok) {
        throw new Error(jsonP1?.error || `Price A failed (${resP1.status})`);
      }

      if (!resP2.ok) {
        throw new Error(jsonP2?.error || `Price B failed (${resP2.status})`);
      }

      if (!resC.ok) {
        throw new Error(jsonC?.error || `Correlation failed (${resC.status})`);
      }

      const s1 = normalizePriceHistory(jsonP1);
      const s2 = normalizePriceHistory(jsonP2);

      const map = new Map();

      for (const row of s1) {
        map.set(row.date, {
          date: row.date,
          price1: row.price,
          price2: null,
        });
      }

      for (const row of s2) {
        if (map.has(row.date)) {
          map.get(row.date).price2 = row.price;
        } else {
          map.set(row.date, {
            date: row.date,
            price1: null,
            price2: row.price,
          });
        }
      }

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      const corrRows = Array.isArray(jsonC) ? jsonC : [];

      const corrClean = corrRows
        .map((row) => ({
          date: formatDateYYYYMMDD(row.as_of_date),
          corr:
            row.rolling_90_correlation == null
              ? null
              : Number(row.rolling_90_correlation),
        }))
        .filter((row) => row.date)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      setCorrSeries(corrClean);

      if (corrClean.length > 0) {
        const corrDates = new Set(corrClean.map((row) => row.date));
        const trimmedPriceSeries = merged.filter((row) => corrDates.has(row.date));

        setPriceSeries(trimmedPriceSeries);
      } else {
        setPriceSeries([]);
      }
    } catch (e) {
      setError(e.message || "Fetch error");
    } finally {
      setLoading(false);
    }
  };

  const secAName = security1 ? formatSecurityLabel(security1) : "";
  const secBName = security2 ? formatSecurityLabel(security2) : "";

  const title = useMemo(() => {
    if (!security1 || !security2 || !frequency || !rangeValue) return "";

    return `${secAName} vs ${secBName} (${frequency}, ${rangeValue})`;
  }, [secAName, secBName, security1, security2, frequency, rangeValue]);

  const latestCorr = useMemo(() => {
    const values = corrSeries
      .map((row) => row.corr)
      .filter((value) => Number.isFinite(value));

    if (!values.length) return null;

    return values[values.length - 1];
  }, [corrSeries]);

  const corrMinMax = useMemo(() => {
    const values = corrSeries
      .map((row) => row.corr)
      .filter((value) => Number.isFinite(value));

    if (!values.length) return null;

    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [corrSeries]);

  const Dropdown = ({ open, items, onPick, emptyText, isSecurity }) => {
    if (!open) return null;

    return (
      <div className="crl-dd">
        {items.length === 0 ? (
          <div className="crl-dd-empty">{emptyText}</div>
        ) : (
          items.map((item) => (
            <button
              key={item.security_id ?? item.value}
              className="crl-dd-item"
              type="button"
              onClick={() => onPick(item)}
            >
              <div className="crl-dd-main">
                {isSecurity ? formatSecurityLabel(item) : item.label}
              </div>

              {isSecurity && item.ticker ? (
                <div className="crl-dd-sub">{item.ticker}</div>
              ) : null}
            </button>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="crl-container">
      <aside className="crl-sidebar">
        <div className="crl-sidebarScroll crl-desktop-sidebarScroll">
          <div className="crl-sidebar-top">
            <h2 className="crl-sidebar-title">Correlations</h2>
            <div className="crl-sidebar-subtitle">
              Pick two securities, frequency, range, and end date.
            </div>
          </div>

          {secLoading ? <div className="crl-hint">Loading securities…</div> : null}
          {secError ? <div className="crl-error">{secError}</div> : null}

          <div className="crl-control" ref={sec1Ref}>
            <label>Security A</label>

            <div className="crl-dd-inputWrap">
              <input
                className="crl-input crl-dd-input"
                value={sec1Query}
                placeholder="Select / type to search…"
                onChange={(e) => {
                  setSec1Query(e.target.value);
                  setSec1Open(true);
                }}
                onFocus={(e) => {
                  e.target.select();
                  setSec1Open(true);
                }}
                onClick={(e) => {
                  e.target.select();
                  setSec1Open(true);
                }}
              />

              <button
                type="button"
                className="crl-dd-toggle"
                onClick={() => setSec1Open((prev) => !prev)}
                aria-label="Toggle Security A dropdown"
              >
                ▾
              </button>
            </div>

            <Dropdown
              open={sec1Open}
              items={filteredSec1}
              onPick={pickSecurity1}
              emptyText="No matches"
              isSecurity
            />
          </div>

          <div className="crl-control" ref={sec2Ref}>
            <label>Security B</label>

            <div className="crl-dd-inputWrap">
              <input
                className="crl-input crl-dd-input"
                value={sec2Query}
                placeholder="Select / type to search…"
                onChange={(e) => {
                  setSec2Query(e.target.value);
                  setSec2Open(true);
                }}
                onFocus={(e) => {
                  e.target.select();
                  setSec2Open(true);
                }}
                onClick={(e) => {
                  e.target.select();
                  setSec2Open(true);
                }}
              />

              <button
                type="button"
                className="crl-dd-toggle"
                onClick={() => setSec2Open((prev) => !prev)}
                aria-label="Toggle Security B dropdown"
              >
                ▾
              </button>
            </div>

            <Dropdown
              open={sec2Open}
              items={filteredSec2}
              onPick={pickSecurity2}
              emptyText="No matches"
              isSecurity
            />
          </div>

          <div className="crl-control" ref={freqRef}>
            <label>Frequency</label>

            <div className="crl-dd-inputWrap">
              <input
                className="crl-input crl-dd-input"
                value={freqQuery}
                placeholder="Select frequency…"
                onChange={(e) => {
                  setFreqTyping(true);
                  setFreqQuery(e.target.value.toUpperCase());
                  setFreqOpen(true);
                }}
                onFocus={(e) => {
                  e.target.select();
                  setFreqTyping(false);
                  setFreqOpen(true);
                }}
                onClick={(e) => {
                  e.target.select();
                  setFreqTyping(false);
                  setFreqOpen(true);
                }}
              />

              <button
                type="button"
                className="crl-dd-toggle"
                onClick={() => {
                  setFreqTyping(false);
                  setFreqOpen((prev) => !prev);
                }}
                aria-label="Toggle Frequency dropdown"
              >
                ▾
              </button>
            </div>

            <Dropdown
              open={freqOpen}
              items={filteredFreq}
              onPick={pickFrequency}
              emptyText="No matches"
            />
          </div>

          <div className="crl-control" ref={rangeRef}>
            <label>Range</label>

            <div className="crl-dd-inputWrap">
              <input
                className="crl-input crl-dd-input"
                value={rangeQuery}
                placeholder="Select range…"
                onChange={(e) => {
                  setRangeTyping(true);
                  setRangeQuery(e.target.value.toUpperCase());
                  setRangeOpen(true);
                }}
                onFocus={(e) => {
                  e.target.select();
                  setRangeTyping(false);
                  setRangeOpen(true);
                }}
                onClick={(e) => {
                  e.target.select();
                  setRangeTyping(false);
                  setRangeOpen(true);
                }}
              />

              <button
                type="button"
                className="crl-dd-toggle"
                onClick={() => {
                  setRangeTyping(false);
                  setRangeOpen((prev) => !prev);
                }}
                aria-label="Toggle Range dropdown"
              >
                ▾
              </button>
            </div>

            <Dropdown
              open={rangeOpen}
              items={filteredRange}
              onPick={pickRange}
              emptyText="No matches"
            />
          </div>

          <div className="crl-control">
            <label>End Date</label>

            <input
              className="crl-input"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button
            className="crl-btn"
            onClick={fetchAll}
            disabled={loading}
            type="button"
          >
            {loading ? "Loading…" : "Load Correlation"}
          </button>

          {error ? <div className="crl-error">{error}</div> : null}

          <div className="crl-hint crl-footnote">
            Rolling correlation is shown only where the 90-period window exists.
          </div>
        </div>

        <div className="crl-mobile-controls">
          <div className="crl-mobile-card">
            {secLoading ? (
              <div className="crl-mobile-hint">Loading securities…</div>
            ) : null}

            <div className="crl-mobile-section">
              <div className="crl-mobile-label">Security A</div>

              <select
                className="crl-mobile-select"
                value={security1?.security_id || ""}
                onChange={(e) => {
                  const picked = securities.find(
                    (security) =>
                      String(security.security_id) === String(e.target.value)
                  );

                  if (picked) pickSecurity1(picked);
                }}
              >
                <option value="">Select...</option>
                {securities.map((security) => (
                  <option key={security.security_id} value={security.security_id}>
                    {formatSecurityLabel(security)}
                  </option>
                ))}
              </select>
            </div>

            <div className="crl-mobile-section">
              <div className="crl-mobile-label">Security B</div>

              <select
                className="crl-mobile-select"
                value={security2?.security_id || ""}
                onChange={(e) => {
                  const picked = securities.find(
                    (security) =>
                      String(security.security_id) === String(e.target.value)
                  );

                  if (picked) pickSecurity2(picked);
                }}
              >
                <option value="">Select...</option>
                {securities.map((security) => (
                  <option key={security.security_id} value={security.security_id}>
                    {formatSecurityLabel(security)}
                  </option>
                ))}
              </select>
            </div>

            <div className="crl-mobile-grid">
              <div className="crl-mobile-section">
                <div className="crl-mobile-label">Frequency</div>

                <select
                  className="crl-mobile-select"
                  value={frequency}
                  onChange={(e) => {
                    const picked = frequencies.find(
                      (item) => item.value === e.target.value
                    );

                    if (picked) pickFrequency(picked);
                  }}
                >
                  <option value="">Select...</option>
                  {frequencies.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="crl-mobile-section">
                <div className="crl-mobile-label">Range</div>

                <select
                  className="crl-mobile-select"
                  value={rangeValue}
                  onChange={(e) => {
                    const picked = ranges.find(
                      (item) => item.value === e.target.value
                    );

                    if (picked) pickRange(picked);
                  }}
                >
                  <option value="">Select...</option>
                  {ranges.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="crl-mobile-section">
              <div className="crl-mobile-label">End Date</div>

              <input
                className="crl-mobile-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="crl-mobile-load"
              onClick={fetchAll}
              disabled={loading}
            >
              {loading ? "Loading..." : "Load Correlation"}
            </button>

            {secError ? <div className="crl-mobile-error">{secError}</div> : null}
            {error ? <div className="crl-mobile-error">{error}</div> : null}
          </div>
        </div>
      </aside>

      <main className="crl-main">
        {!hasLoaded ? (
          <div className="crl-empty-state">
            <p>Pick two securities, a frequency, range, and end date.</p>
          </div>
        ) : (
          <>
            {title ? <h1 className="crl-title">{title}</h1> : null}

            {corrSeries.length > 0 && (
              <div className="crl-stats-row">
                <div className="crl-stat-card">
                  <span className="crl-stat-label">Latest Corr</span>
                  <span className="crl-stat-value">
                    {latestCorr !== null && Number.isFinite(latestCorr)
                      ? latestCorr.toFixed(3)
                      : "-"}
                  </span>
                </div>

                <div className="crl-stat-card">
                  <span className="crl-stat-label">Max Corr</span>
                  <span className="crl-stat-value">
                    {corrMinMax ? corrMinMax.max.toFixed(3) : "-"}
                  </span>
                </div>

                <div className="crl-stat-card">
                  <span className="crl-stat-label">Min Corr</span>
                  <span className="crl-stat-value">
                    {corrMinMax ? corrMinMax.min.toFixed(3) : "-"}
                  </span>
                </div>

                <div className="crl-stat-card">
                  <span className="crl-stat-label">Points</span>
                  <span className="crl-stat-value">{corrSeries.length}</span>
                </div>
              </div>
            )}

            <div className="crl-charts">
              <section className="crl-chart-block crl-chart-block--price">
                <div className="crl-chart-header">
                  <div>
                    <div className="crl-chart-kicker">Price Comparison</div>
                    <div className="crl-chart-name">Security A vs Security B</div>
                  </div>
                </div>

                {priceSeries.length === 0 ? (
                  <div className="crl-empty">No price history to display.</div>
                ) : (
                  <>
                    <div className="crl-chart-scroll-hint">
                      Swipe sideways to view the full chart
                    </div>

                    <div className="crl-chart-scroll-area" ref={priceScrollRef}>
                      <div className="crl-chart-inner">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={priceSeries}
                            margin={{ top: 12, right: 55, left: 15, bottom: 8 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={formatDateYYYYMMDD} />
                            <YAxis
                              yAxisId="left"
                              label={{
                                value: "Price A",
                                angle: -90,
                                position: "insideLeft",
                              }}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              label={{
                                value: "Price B",
                                angle: 90,
                                position: "insideRight",
                              }}
                            />
                            <Tooltip labelFormatter={formatDateYYYYMMDD} />
                            <Legend />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="price1"
                              dot={false}
                              connectNulls={false}
                              stroke="#FF4C4C"
                              strokeWidth={0.8}
                              name={secAName || "Security A"}
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="price2"
                              dot={false}
                              connectNulls={false}
                              stroke="#1E88E5"
                              strokeWidth={0.8}
                              name={secBName || "Security B"}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                )}
              </section>

              <section className="crl-chart-block crl-chart-block--corr">
                <div className="crl-chart-header">
                  <div>
                    <div className="crl-chart-kicker">Rolling Correlation</div>
                    <div className="crl-chart-name">90 Period Correlation</div>
                  </div>
                </div>

                {corrSeries.length === 0 ? (
                  <div className="crl-empty">No correlation data to display.</div>
                ) : (
                  <>
                    <div className="crl-chart-scroll-hint">
                      Swipe sideways to view the full chart
                    </div>

                    <div className="crl-chart-scroll-area" ref={corrScrollRef}>
                      <div className="crl-chart-inner">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={corrSeries}
                            margin={{ top: 8, right: 35, left: 15, bottom: 8 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={formatDateYYYYMMDD} />
                            <YAxis
                              domain={[-1, 1]}
                              label={{
                                value: "Correlation",
                                angle: -90,
                                position: "insideLeft",
                              }}
                            />
                            <Tooltip labelFormatter={formatDateYYYYMMDD} />
                            <Line
                              type="monotone"
                              dataKey="corr"
                              dot={false}
                              connectNulls={false}
                              stroke="#00796b"
                              strokeWidth={2}
                              name="Rolling 90 Corr"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Correlations;