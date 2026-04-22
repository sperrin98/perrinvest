import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./SeasonalityRebased.css";

ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
);

const API_URL = process.env.REACT_APP_API_URL;

const srbxSecurityLabel = (s) => {
  if (!s) return "";
  return s.security_long_name || s.security_short_name || s.ticker || "";
};

function SrbxSecurityDropdown({
  label,
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
    <div className="srbx-control" ref={refProp}>
      <label>{label}</label>
      <div className="srbx-dd-inputWrap">
        <input
          className="srbx-input srbx-dd-input"
          value={query}
          placeholder="Select / type to search…"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
        />
        <button
          type="button"
          className="srbx-dd-toggle"
          onClick={() => setOpen((p) => !p)}
        >
          ▾
        </button>
      </div>

      {open && (
        <div className="srbx-dd">
          {filtered.length === 0 ? (
            <div className="srbx-dd-empty">No matches</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.security_id}
                className="srbx-dd-item"
                type="button"
                onClick={() => onPick(item)}
              >
                <div className="srbx-dd-main">{item.security_long_name}</div>
                <div className="srbx-dd-sub">
                  {item.security_short_name || item.ticker || ""}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SeasonalityRebased() {
  const [securities, setSecurities] = useState([]);
  const [loadingSecurities, setLoadingSecurities] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState("");

  const [sec1, setSec1] = useState(null);
  const [sec2, setSec2] = useState(null);
  const [sec3, setSec3] = useState(null);
  const [sec4, setSec4] = useState(null);

  const [sec1Query, setSec1Query] = useState("");
  const [sec2Query, setSec2Query] = useState("");
  const [sec3Query, setSec3Query] = useState("");
  const [sec4Query, setSec4Query] = useState("");

  const [sec1Open, setSec1Open] = useState(false);
  const [sec2Open, setSec2Open] = useState(false);
  const [sec3Open, setSec3Open] = useState(false);
  const [sec4Open, setSec4Open] = useState(false);

  const [year, setYear] = useState("");
  const [rows, setRows] = useState([]);

  const sec1Ref = useRef(null);
  const sec2Ref = useRef(null);
  const sec3Ref = useRef(null);
  const sec4Ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (sec1Ref.current && !sec1Ref.current.contains(e.target)) setSec1Open(false);
      if (sec2Ref.current && !sec2Ref.current.contains(e.target)) setSec2Open(false);
      if (sec3Ref.current && !sec3Ref.current.contains(e.target)) setSec3Open(false);
      if (sec4Ref.current && !sec4Ref.current.contains(e.target)) setSec4Open(false);
    };

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const fetchSecurities = async () => {
      try {
        setLoadingSecurities(true);
        setError("");

        const response = await axios.get(`${API_URL}/seasonality-rebased/securities`);
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

  const selectedIds = useMemo(() => {
    return [sec1, sec2, sec3, sec4]
      .map((s) => s?.security_id)
      .filter((id) => Number.isFinite(Number(id)));
  }, [sec1, sec2, sec3, sec4]);

  const duplicatesExist = useMemo(() => {
    if (selectedIds.length !== 4) return false;
    return new Set(selectedIds).size !== 4;
  }, [selectedIds]);

  const fetchComparison = async () => {
    if (!year) {
      setError("Please select a year.");
      setRows([]);
      return;
    }

    if (!sec1 || !sec2 || !sec3 || !sec4) {
      setError("Please select all 4 securities.");
      setRows([]);
      return;
    }

    if (duplicatesExist) {
      setError("Please select 4 different securities.");
      setRows([]);
      return;
    }

    try {
      setLoadingChart(true);
      setError("");

      const response = await axios.get(`${API_URL}/seasonality-rebased`, {
        params: {
          year,
          security_ids: [
            sec1.security_id,
            sec2.security_id,
            sec3.security_id,
            sec4.security_id,
          ].join(","),
        },
      });

      const cleaned = (Array.isArray(response.data) ? response.data : [])
        .map((row) => ({
          security_id: Number(row.security_id),
          security_long_name: row.security_long_name || "",
          day_in_year: row.day_in_year != null ? Number(row.day_in_year) : null,
          rebased_100: row.rebased_100 != null ? Number(row.rebased_100) : null,
          price_date: row.price_date || null,
        }))
        .filter(
          (row) =>
            Number.isFinite(row.security_id) &&
            Number.isFinite(row.day_in_year) &&
            Number.isFinite(row.rebased_100)
        )
        .sort((a, b) => a.day_in_year - b.day_in_year);

      setRows(cleaned);
    } catch (err) {
      console.error(err);
      setError("Failed to load seasonality rebased comparison.");
      setRows([]);
    } finally {
      setLoadingChart(false);
    }
  };

  const seriesMap = useMemo(() => {
    const selected = [sec1, sec2, sec3, sec4].filter(Boolean);
    const map = {};

    selected.forEach((security) => {
      map[security.security_id] = {
        label: security.security_long_name,
        data: [],
      };
    });

    rows.forEach((row) => {
      if (map[row.security_id]) {
        map[row.security_id].data.push({
          x: row.day_in_year,
          y: row.rebased_100,
        });
      }
    });

    Object.keys(map).forEach((key) => {
      map[key].data.sort((a, b) => a.x - b.x);
    });

    return map;
  }, [rows, sec1, sec2, sec3, sec4]);

  const chartData = useMemo(() => {
    const selected = [sec1, sec2, sec3, sec4].filter(Boolean);
    const colors = ["#e84d4d", "#0f766e", "#1d4ed8", "#d97706"];

    return {
      datasets: selected.map((security, index) => ({
        label: security.security_long_name,
        data: seriesMap[security.security_id]?.data || [],
        borderColor: colors[index],
        backgroundColor: colors[index],
        borderWidth: 1.2,
        pointRadius: 0,
        tension: 0.15,
        fill: false,
        spanGaps: true,
      })),
    };
  }, [seriesMap, sec1, sec2, sec3, sec4]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    parsing: false,
    animation: {
      duration: 220,
      easing: "linear",
    },
    interaction: {
      mode: "nearest",
      intersect: false,
    },
    plugins: {
      legend: {
        labels: { color: "#00796b" },
      },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#123c36",
        bodyColor: "#123c36",
        borderColor: "rgba(15, 118, 110, 0.18)",
        borderWidth: 1,
        padding: 12,
        callbacks: {
          title: (items) => {
            if (!items.length) return "";
            return `Day ${items[0].raw.x}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        title: { display: true, text: "Day In Year", color: "#00796b" },
        ticks: { color: "#00796b" },
        grid: { color: "rgb(202, 202, 202)" },
      },
      y: {
        title: { display: true, text: "Rebased to 100", color: "#00796b" },
        ticks: { color: "#00796b" },
        grid: { color: "rgb(202, 202, 202)" },
      },
    },
  };

  const summaryCards = useMemo(() => {
    const selected = [sec1, sec2, sec3, sec4].filter(Boolean);

    return selected.map((security, index) => {
      const values = (seriesMap[security.security_id]?.data || []).map((p) => p.y);
      const currentValue = values.length ? values[values.length - 1] : null;

      const clsList = [
        "srbx-summary-card-red",
        "srbx-summary-card-teal",
        "srbx-summary-card-blue",
        "srbx-summary-card-orange",
      ];

      return {
        name: security.security_long_name,
        points: values.length,
        currentValue,
        cls: clsList[index],
      };
    });
  }, [seriesMap, sec1, sec2, sec3, sec4]);

  const titleText = year
    ? `Seasonality Rebased Comparison: ${year}`
    : "Seasonality Rebased Comparison";

  return (
    <div className="srbx-page">
      <div className="srbx-container">
        <aside className="srbx-sidebar">
          <div className="srbx-sidebar-top">
            <h2 className="srbx-sidebar-title">Seasonality Rebased</h2>
            <div className="srbx-sidebar-subtitle">
              Compare 4 securities rebased to 100 in the selected calendar year.
            </div>
          </div>

          {loadingSecurities ? <div className="srbx-hint">Loading securities…</div> : null}
          {error ? <div className="srbx-error">{error}</div> : null}

          <div className="srbx-control">
            <label>Year</label>
            <input
              className="srbx-input"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min="1900"
              max="2100"
              placeholder="Select year…"
            />
          </div>

          <SrbxSecurityDropdown
            label="Security 1"
            query={sec1Query}
            setQuery={setSec1Query}
            open={sec1Open}
            setOpen={setSec1Open}
            refProp={sec1Ref}
            items={securities}
            onPick={(item) => {
              setSec1(item);
              setSec1Query(srbxSecurityLabel(item));
              setSec1Open(false);
            }}
          />

          <SrbxSecurityDropdown
            label="Security 2"
            query={sec2Query}
            setQuery={setSec2Query}
            open={sec2Open}
            setOpen={setSec2Open}
            refProp={sec2Ref}
            items={securities}
            onPick={(item) => {
              setSec2(item);
              setSec2Query(srbxSecurityLabel(item));
              setSec2Open(false);
            }}
          />

          <SrbxSecurityDropdown
            label="Security 3"
            query={sec3Query}
            setQuery={setSec3Query}
            open={sec3Open}
            setOpen={setSec3Open}
            refProp={sec3Ref}
            items={securities}
            onPick={(item) => {
              setSec3(item);
              setSec3Query(srbxSecurityLabel(item));
              setSec3Open(false);
            }}
          />

          <SrbxSecurityDropdown
            label="Security 4"
            query={sec4Query}
            setQuery={setSec4Query}
            open={sec4Open}
            setOpen={setSec4Open}
            refProp={sec4Ref}
            items={securities}
            onPick={(item) => {
              setSec4(item);
              setSec4Query(srbxSecurityLabel(item));
              setSec4Open(false);
            }}
          />

          <button className="srbx-load-btn" onClick={fetchComparison} type="button">
            Load Comparison
          </button>
        </aside>

        <div className="srbx-main">
          <h1 className="srbx-title">{titleText}</h1>

          {summaryCards.length > 0 && (
            <div className="srbx-summary-grid">
              {summaryCards.map((card) => (
                <div key={card.name} className={`srbx-summary-card ${card.cls}`}>
                  <div className="srbx-summary-name">{card.name}</div>
                  <div className="srbx-summary-label">Points Returned</div>
                  <div className="srbx-summary-value">{card.points}</div>
                  <div className="srbx-summary-sub">
                    Latest Rebased:{" "}
                    {card.currentValue !== null && Number.isFinite(card.currentValue)
                      ? card.currentValue.toFixed(2)
                      : "-"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {loadingChart ? (
            <div className="srbx-empty-state">
              <p>Loading chart...</p>
            </div>
          ) : chartData.datasets.length === 4 &&
            chartData.datasets.every((d) => d.data.length > 0) ? (
            <div className="srbx-chart-card">
              <div className="srbx-chart-canvas">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          ) : (
            <div className="srbx-empty-state">
              <p>Select a year, choose four different securities, and load the comparison.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SeasonalityRebased;