import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Correlations.css';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
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

  // ✅ changed: no default selection
  const [freqQuery, setFreqQuery] = useState('');
  const [freqOpen, setFreqOpen] = useState(false);
  const [frequency, setFrequency] = useState('');

  const [historyLength, setHistoryLength] = useState(600);

  const [data, setData] = useState([]);
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
        } catch (e) {
          throw new Error(
            `Securities API did not return JSON. First 200 chars: ${text.slice(0, 200)}`
          );
        }

        if (!res.ok) throw new Error(json?.error || `Failed to load securities (${res.status})`);

        const rows = Array.isArray(json) ? json : [];
        setSecurities(rows);
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
    const q = (freqQuery || '').trim().toUpperCase();
    if (!q) return frequencies;
    return frequencies.filter((f) => f.label.includes(q));
  }, [frequencies, freqQuery]);

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
    setFreqOpen(false);
  };

  const fetchCorr = async () => {
    setHasLoaded(false);
    setError('');
    setData([]);

    if (!apiBase) {
      setError('REACT_APP_API_URL is missing.');
      setHasLoaded(true);
      return;
    }
    if (!security1?.security_id || !security2?.security_id) {
      setError('Pick two securities first.');
      setHasLoaded(true);
      return;
    }
    // ✅ changed: require frequency selection
    if (!frequency) {
      setError('Pick a frequency (DAILY / WEEKLY / MONTHLY / QUARTERLY).');
      setHasLoaded(true);
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        security_id_1: String(security1.security_id),
        security_id_2: String(security2.security_id),
        frequency,
        history_length: String(historyLength)
      });

      const res = await fetch(`${apiBase}/rolling-corr?${params.toString()}&_=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });

      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        throw new Error(
          `API did not return JSON. Status ${res.status}. First 200 chars: ${text.slice(0, 200)}`
        );
      }

      if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`);

      const rows = Array.isArray(json) ? json : [];
      const cleaned = rows.map((r) => ({
        date: r.price_date_1,
        corr: r.rolling_90_correlation == null ? null : Number(r.rolling_90_correlation),
        n: r.periods_in_window
      }));

      setData(cleaned);
      setHasLoaded(true);
    } catch (e) {
      setError(e.message || 'Fetch error');
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const title = useMemo(() => {
    const a = security1 ? formatSecurityLabel(security1) : 'Security A';
    const b = security2 ? formatSecurityLabel(security2) : 'Security B';
    return `${a} vs ${b} — Rolling 90 Correlation`;
  }, [security1, security2]);

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
            <div className="crl-sidebar-subtitle">
              Pick two securities, choose frequency, then load.
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
                onClick={() => setSec1Open((p) => !p)}
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
                onClick={() => setSec2Open((p) => !p)}
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
                placeholder="Select frequency (DAILY / WEEKLY / …)"
                onChange={(e) => {
                  setFreqQuery(e.target.value.toUpperCase());
                  setFreqOpen(true);
                }}
                onFocus={(e) => {
                  e.target.select();
                  setFreqOpen(true);
                }}
                onClick={(e) => {
                  e.target.select();
                  setFreqOpen(true);
                }}
              />
              <button
                type="button"
                className="crl-dd-toggle"
                onClick={() => setFreqOpen((p) => !p)}
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

          <button className="crl-btn" onClick={fetchCorr} disabled={loading} type="button">
            {loading ? 'Loading…' : 'Load Correlation'}
          </button>

          {error ? <div className="crl-error">{error}</div> : null}

          <div className="crl-hint crl-footnote">Correlation is NULL until 90 periods exist.</div>
        </div>

        <div className="crl-main">
          <h1 className="crl-title">{title}</h1>

          <div className="crl-chart-wrapper">
            {!hasLoaded ? (
              <div className="crl-empty">Choose inputs and click “Load Correlation”.</div>
            ) : data.length === 0 ? (
              <div className="crl-empty">No data to display.</div>
            ) : (
              <div className="crl-chart-inner">
                <ResponsiveContainer width="100%" height="92%">
                  <LineChart data={data} margin={{ top: 20, right: 50, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={formatDateYYYYMMDD} />
                    <YAxis
                      domain={[-1, 1]}
                      label={{ value: 'Correlation', angle: -90, position: 'insideLeft' }}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Correlations;