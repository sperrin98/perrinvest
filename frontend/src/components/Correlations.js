import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Correlations.css';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Format date as YYYY-MM-DD
const formatDateYYYYMMDD = (dateStr) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const normalizePriceHistory = (raw) => {
  const rows = Array.isArray(raw) ? raw : [];
  const out = [];

  for (const r of rows) {
    if (Array.isArray(r)) {
      const dateVal = r[1];
      const priceVal = r[2];
      if (dateVal != null && priceVal != null) {
        const date = formatDateYYYYMMDD(dateVal);
        const price = Number(priceVal);
        if (!Number.isNaN(price)) out.push({ date, price });
      }
    } else if (r && typeof r === 'object') {
      const dateVal = r.price_date ?? r.date;
      const priceVal = r.price ?? r.close ?? r.value;
      if (dateVal != null && priceVal != null) {
        const date = formatDateYYYYMMDD(dateVal);
        const price = Number(priceVal);
        if (!Number.isNaN(price)) out.push({ date, price });
      }
    }
  }

  out.sort((a, b) => new Date(a.date) - new Date(b.date));
  return out;
};

function Correlations() {
  const apiBase = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

  const [securities, setSecurities] = useState([]);
  const [secLoading, setSecLoading] = useState(false);
  const [secError, setSecError] = useState('');

  const [sec1Query, setSec1Query] = useState('');
  const [sec2Query, setSec2Query] = useState('');
  const [sec1Open, setSec1Open] = useState(false);
  const [sec2Open, setSec2Open] = useState(false);

  const [security1, setSecurity1] = useState(null);
  const [security2, setSecurity2] = useState(null);

  const frequencies = useMemo(
    () => [
      { value: 'DAILY', label: 'DAILY' },
      { value: 'WEEKLY', label: 'WEEKLY' },
      { value: 'MONTHLY', label: 'MONTHLY' },
      { value: 'QUARTERLY', label: 'QUARTERLY' }
    ],
    []
  );

  const [freqQuery, setFreqQuery] = useState('');
  const [freqOpen, setFreqOpen] = useState(false);
  const [frequency, setFrequency] = useState('');
  const [freqTyping, setFreqTyping] = useState(false);

  const [historyLength, setHistoryLength] = useState(600);

  const [priceSeries, setPriceSeries] = useState([]);
  const [corrSeries, setCorrSeries] = useState([]);

  // ✅ nothing in main area until click
  const [hasLoaded, setHasLoaded] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sec1Ref = useRef(null);
  const sec2Ref = useRef(null);
  const freqRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (sec1Ref.current && !sec1Ref.current.contains(e.target)) setSec1Open(false);
      if (sec2Ref.current && !sec2Ref.current.contains(e.target)) setSec2Open(false);
      if (freqRef.current && !freqRef.current.contains(e.target)) setFreqOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    const fetchSecurities = async () => {
      if (!apiBase) {
        setSecError('REACT_APP_API_URL is missing.');
        return;
      }

      setSecLoading(true);
      setSecError('');

      try {
        const res = await fetch(`${apiBase}/securities?_=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });

        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error(`Securities API did not return JSON. First 200 chars: ${text.slice(0, 200)}`);
        }

        if (!res.ok) throw new Error(json?.error || `Failed to load securities (${res.status})`);
        setSecurities(Array.isArray(json) ? json : []);
      } catch (e) {
        setSecError(e.message || 'Error loading securities');
        setSecurities([]);
      } finally {
        setSecLoading(false);
      }
    };

    fetchSecurities();
  }, [apiBase]);

  const formatSecurityLabel = (s) => {
    if (!s) return '';
    const name = s.security_long_name || s.name || '';
    const ticker = s.ticker ? ` (${s.ticker})` : '';
    return `${name}${ticker}`;
  };

  const filteredSec1 = useMemo(() => {
    const q = (sec1Query || '').trim().toLowerCase();
    if (!q) return securities;
    return securities.filter((s) => {
      const name = (s.security_long_name || '').toLowerCase();
      const ticker = (s.ticker || '').toLowerCase();
      return name.includes(q) || ticker.includes(q);
    });
  }, [securities, sec1Query]);

  const filteredSec2 = useMemo(() => {
    const q = (sec2Query || '').trim().toLowerCase();
    if (!q) return securities;
    return securities.filter((s) => {
      const name = (s.security_long_name || '').toLowerCase();
      const ticker = (s.ticker || '').toLowerCase();
      return name.includes(q) || ticker.includes(q);
    });
  }, [securities, sec2Query]);

  const filteredFreq = useMemo(() => {
    if (!freqTyping) return frequencies;
    const q = (freqQuery || '').trim().toUpperCase();
    if (!q) return frequencies;
    return frequencies.filter((f) => f.label.includes(q));
  }, [frequencies, freqQuery, freqTyping]);

  const pickSecurity1 = (s) => {
    setSecurity1(s);
    setSec1Query(formatSecurityLabel(s));
    setSec1Open(false);
  };

  const pickSecurity2 = (s) => {
    setSecurity2(s);
    setSec2Query(formatSecurityLabel(s));
    setSec2Open(false);
  };

  const pickFrequency = (f) => {
    setFrequency(f.value);
    setFreqQuery(f.label);
    setFreqTyping(false);
    setFreqOpen(false);
  };

  const fetchAll = async () => {
    setHasLoaded(true);

    setError('');
    setPriceSeries([]);
    setCorrSeries([]);

    if (!apiBase) {
      setError('REACT_APP_API_URL is missing.');
      return;
    }
    if (!security1?.security_id || !security2?.security_id) {
      setError('Pick two securities first.');
      return;
    }
    if (!frequency) {
      setError('Pick a frequency (DAILY / WEEKLY / MONTHLY / QUARTERLY).');
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
        history_length: String(historyLength)
      });
      const corrUrl = `${apiBase}/rolling-corr?${corrParams.toString()}&_=${Date.now()}`;

      const [resP1, resP2, resC] = await Promise.all([
        fetch(priceUrl1, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
        fetch(priceUrl2, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }),
        fetch(corrUrl,  { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
      ]);

      const [txtP1, txtP2, txtC] = await Promise.all([resP1.text(), resP2.text(), resC.text()]);

      let jsonP1, jsonP2, jsonC;
      try { jsonP1 = JSON.parse(txtP1); } catch { throw new Error(`Price A not JSON. First 200: ${txtP1.slice(0,200)}`); }
      try { jsonP2 = JSON.parse(txtP2); } catch { throw new Error(`Price B not JSON. First 200: ${txtP2.slice(0,200)}`); }
      try { jsonC  = JSON.parse(txtC);  } catch { throw new Error(`Corr not JSON. First 200: ${txtC.slice(0,200)}`); }

      if (!resP1.ok) throw new Error(jsonP1?.error || `Price A failed (${resP1.status})`);
      if (!resP2.ok) throw new Error(jsonP2?.error || `Price B failed (${resP2.status})`);
      if (!resC.ok)  throw new Error(jsonC?.error  || `Correlation failed (${resC.status})`);

      const s1 = normalizePriceHistory(jsonP1);
      const s2 = normalizePriceHistory(jsonP2);

      const map = new Map();
      for (const r of s1) map.set(r.date, { date: r.date, price1: r.price, price2: null });
      for (const r of s2) {
        if (map.has(r.date)) map.get(r.date).price2 = r.price;
        else map.set(r.date, { date: r.date, price1: null, price2: r.price });
      }

      const merged = Array.from(map.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
      setPriceSeries(merged);

      const corrRows = Array.isArray(jsonC) ? jsonC : [];
      const corrClean = corrRows.map((r) => ({
        date: r.price_date_1,
        corr: r.rolling_90_correlation == null ? null : Number(r.rolling_90_correlation)
      }));
      setCorrSeries(corrClean);
    } catch (e) {
      setError(e.message || 'Fetch error');
    } finally {
      setLoading(false);
    }
  };

  const secAName = security1 ? formatSecurityLabel(security1) : '';
  const secBName = security2 ? formatSecurityLabel(security2) : '';

  const title = useMemo(() => {
    if (!security1 || !security2 || !frequency) return '';
    return `${secAName} vs ${secBName} (${frequency})`;
  }, [secAName, secBName, security1, security2, frequency]);

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
              {isSecurity && item.ticker ? <div className="crl-dd-sub">{item.ticker}</div> : null}
            </button>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="crl-page">
      <div className="crl-container">
        <div className="crl-sidebar">
          <div className="crl-sidebar-top">
            <h2 className="crl-sidebar-title">Correlations</h2>
            <div className="crl-sidebar-subtitle">Pick two securities, choose frequency, then load.</div>
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
                onClick={() => setSec1Open((p) => !p)}
                aria-label="Toggle Security A dropdown"
              >
                ▾
              </button>
            </div>
            <Dropdown open={sec1Open} items={filteredSec1} onPick={pickSecurity1} emptyText="No matches" isSecurity />
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
                onClick={() => setSec2Open((p) => !p)}
                aria-label="Toggle Security B dropdown"
              >
                ▾
              </button>
            </div>
            <Dropdown open={sec2Open} items={filteredSec2} onPick={pickSecurity2} emptyText="No matches" isSecurity />
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
                  setFreqOpen((p) => !p);
                }}
                aria-label="Toggle Frequency dropdown"
              >
                ▾
              </button>
            </div>
            <Dropdown open={freqOpen} items={filteredFreq} onPick={pickFrequency} emptyText="No matches" />
          </div>

          <div className="crl-control">
            <label>History Length</label>
            <input
              className="crl-input"
              type="number"
              min={91}
              step={1}
              value={historyLength}
              onChange={(e) => setHistoryLength(Number(e.target.value))}
            />
            <div className="crl-hint">Must be ≥ 91.</div>
          </div>

          <button className="crl-btn" onClick={fetchAll} disabled={loading} type="button">
            {loading ? 'Loading…' : 'Load Correlation'}
          </button>

          {error ? <div className="crl-error">{error}</div> : null}

          <div className="crl-hint crl-footnote">Correlation is NULL until 90 periods exist.</div>
        </div>

        <div className="crl-main">
          {/* ✅ nothing shows here until click */}
          {!hasLoaded ? null : (
            <>
              {title ? <h1 className="crl-title">{title}</h1> : null}

              <div className="crl-charts">
                <div className="crl-chart-block crl-chart-block--price">
                  {priceSeries.length === 0 ? (
                    <div className="crl-empty">No price history to display.</div>
                  ) : (
                    <div className="crl-chart-inner">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={priceSeries} margin={{ top: 18, right: 60, left: 20, bottom: 14 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickFormatter={formatDateYYYYMMDD} />
                          <YAxis yAxisId="left" label={{ value: 'Price A', angle: -90, position: 'insideLeft' }} />
                          <YAxis yAxisId="right" orientation="right" label={{ value: 'Price B', angle: 90, position: 'insideRight' }} />
                          <Tooltip labelFormatter={formatDateYYYYMMDD} />
                          <Legend />
                          <Line yAxisId="left" type="monotone" dataKey="price1" dot={false} connectNulls={false} stroke="#FF4C4C" strokeWidth={0.8} name={secAName || 'Security A'} />
                          <Line yAxisId="right" type="monotone" dataKey="price2" dot={false} connectNulls={false} stroke="#1E88E5" strokeWidth={0.8} name={secBName || 'Security B'} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="crl-chart-block crl-chart-block--corr">
                  {corrSeries.length === 0 ? (
                    <div className="crl-empty">No correlation data to display.</div>
                  ) : (
                    <div className="crl-chart-inner">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={corrSeries} margin={{ top: 12, right: 40, left: 20, bottom: 12 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tickFormatter={formatDateYYYYMMDD} />
                          <YAxis domain={[-1, 1]} label={{ value: 'Correlation', angle: -90, position: 'insideLeft' }} />
                          <Tooltip labelFormatter={formatDateYYYYMMDD} />
                          <Line type="monotone" dataKey="corr" dot={false} connectNulls={false} stroke="#00796b" strokeWidth={2} name="Rolling 90 Corr" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Correlations;