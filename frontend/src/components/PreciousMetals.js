import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Select from "react-select";
import "./PreciousMetals.css";

export default function PreciousMetals() {
  const [metals, setMetals] = useState([]);
  const [selectedMetal, setSelectedMetal] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dailyMoves, setDailyMoves] = useState([]);
  const [dailyMovesSummary, setDailyMovesSummary] = useState([]);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    async function fetchMetals() {
      try {
        const response = await axios.get(`${API_URL}/precious-metals`);
        const data = response.data.data || [];
        setMetals(data);
        if (data.length > 0) {
          setSelectedMetal(data[0]);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching metals:", err);
        setError("Failed to load metals.");
      }
    }

    fetchMetals();
  }, [API_URL]);

  useEffect(() => {
    if (!selectedMetal) return;

    async function fetchTables() {
      try {
        const [dailyMovesResponse, summaryResponse] = await Promise.all([
          axios.get(`${API_URL}/precious-metals/daily-moves`, {
            params: { id: selectedMetal.security_id, year: selectedYear },
          }),
          axios.get(`${API_URL}/precious-metals/daily-moves-summary`, {
            params: { id: selectedMetal.security_id, year: selectedYear },
          }),
        ]);

        setDailyMoves(dailyMovesResponse.data.data || []);
        setDailyMovesSummary(summaryResponse.data.data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching precious metals tables:", err);
        setDailyMoves([]);
        setDailyMovesSummary([]);
        setError("Failed to load daily moves data.");
      }
    }

    fetchTables();
  }, [selectedMetal, selectedYear, API_URL]);

  const years = Array.from(
    { length: new Date().getFullYear() - 1970 },
    (_, i) => new Date().getFullYear() - i
  );

  const yearOptions = useMemo(
    () => years.map((y) => ({ label: y, value: y })),
    [years]
  );

  const metalOptions = useMemo(
    () =>
      metals.map((metal) => ({
        label: metal.security_long_name,
        value: metal.security_id,
        metal,
      })),
    [metals]
  );

  const selectedMetalOption = useMemo(() => {
    if (!selectedMetal) return null;
    return {
      label: selectedMetal.security_long_name,
      value: selectedMetal.security_id,
      metal: selectedMetal,
    };
  }, [selectedMetal]);

  const formatPercent = (num) => {
    if (num === null || num === undefined) return "-";
    return `${(num * 100).toFixed(2)}%`;
  };

  const toneClass = (value) => {
    if (value > 0) return "pm-positive";
    if (value < 0) return "pm-negative";
    return "pm-neutral";
  };

  return (
    <div className="pm-container">
      <aside className="pm-sidebar">
        <div className="pm-sidebar-inner">
          <div className="pm-desktop-controls">
            <h2 className="pm-sidebar-title">Select Metal</h2>

            <ul className="pm-metal-list">
              {metals.map((metal) => (
                <li
                  key={metal.security_id}
                  className={`pm-metal-item ${
                    selectedMetal?.security_id === metal.security_id
                      ? "pm-selected-metal"
                      : ""
                  }`}
                  onClick={() => setSelectedMetal(metal)}
                >
                  {metal.security_long_name}
                </li>
              ))}
            </ul>

            <h2 className="pm-sidebar-title">Select Year</h2>

            <Select
              value={{ label: selectedYear, value: selectedYear }}
              onChange={(option) => setSelectedYear(option.value)}
              options={yearOptions}
              menuPlacement="bottom"
              className="pm-year-select"
              classNamePrefix="pm-year-select"
              isSearchable={false}
            />
          </div>

          <div className="pm-mobile-controls-card">
            <div className="pm-mobile-controls-header">
              <div className="pm-mobile-controls-title">Controls</div>
              <div className="pm-mobile-controls-subtitle">
                Choose metal and year
              </div>
            </div>

            <div className="pm-mobile-control-group">
              <label className="pm-mobile-label">Metal</label>
              <Select
                value={selectedMetalOption}
                onChange={(option) => setSelectedMetal(option.metal)}
                options={metalOptions}
                menuPlacement="auto"
                className="pm-metal-select"
                classNamePrefix="pm-metal-select"
                isSearchable={false}
              />
            </div>

            <div className="pm-mobile-control-group">
              <label className="pm-mobile-label">Year</label>
              <Select
                value={{ label: selectedYear, value: selectedYear }}
                onChange={(option) => setSelectedYear(option.value)}
                options={yearOptions}
                menuPlacement="auto"
                className="pm-year-select pm-year-select-mobile"
                classNamePrefix="pm-year-select"
                isSearchable={false}
              />
            </div>
          </div>
        </div>
      </aside>

      <main className="pm-main">
        <div className="pm-main-inner">
          {error && <p className="pm-error">{error}</p>}

          {selectedMetal && (
            <>
              <h1 className="pm-title">
                {selectedMetal.security_long_name} - {selectedYear}
              </h1>

              <section className="pm-table-card">
                <div className="pm-table-card-header">
                  <div className="pm-table-heading">Daily Moves</div>
                  <div className="pm-table-meta">
                    {dailyMoves.length} {dailyMoves.length === 1 ? "week" : "weeks"}
                  </div>
                </div>

                <div className="pm-mobile-scroll-hint">
                  Swipe sideways to view full table
                </div>

                <div className="pm-table-wrapper">
                  <table className="pm-table pm-daily-table">
                    <colgroup>
                      <col className="pm-col-year" />
                      <col className="pm-col-week" />
                      <col className="pm-col-day" />
                      <col className="pm-col-day" />
                      <col className="pm-col-day" />
                      <col className="pm-col-day" />
                      <col className="pm-col-day" />
                      <col className="pm-col-day" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Week</th>
                        <th>Monday</th>
                        <th>Tuesday</th>
                        <th>Wednesday</th>
                        <th>Thursday</th>
                        <th>Friday</th>
                        <th>Week</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyMoves.length > 0 ? (
                        dailyMoves.map((row, idx) => (
                          <tr key={idx} className="pm-row">
                            <td>{row.year}</td>
                            <td>{row.week}</td>
                            <td className={toneClass(row.monday)}>{formatPercent(row.monday)}</td>
                            <td className={toneClass(row.tuesday)}>{formatPercent(row.tuesday)}</td>
                            <td className={toneClass(row.wednesday)}>{formatPercent(row.wednesday)}</td>
                            <td className={toneClass(row.thursday)}>{formatPercent(row.thursday)}</td>
                            <td className={toneClass(row.friday)}>{formatPercent(row.friday)}</td>
                            <td className={`pm-week-total ${toneClass(row.week_total)}`}>
                              {formatPercent(row.week_total)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="pm-row">
                          <td colSpan="8" className="pm-no-data">
                            {error || "No data available"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="pm-table-card pm-summary-card">
                <div className="pm-table-card-header">
                  <div className="pm-table-heading">Average / Min / Max / STDEV</div>
                  <div className="pm-table-meta">
                    {dailyMovesSummary.length}{" "}
                    {dailyMovesSummary.length === 1 ? "day" : "days"}
                  </div>
                </div>

                <div className="pm-mobile-scroll-hint">
                  Swipe sideways to view full table
                </div>

                <div className="pm-table-wrapper pm-summary-wrapper">
                  <table className="pm-table pm-summary-table">
                    <colgroup>
                      <col className="pm-col-summary-day" />
                      <col className="pm-col-summary-metric" />
                      <col className="pm-col-summary-metric" />
                      <col className="pm-col-summary-metric" />
                      <col className="pm-col-summary-metric" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Average</th>
                        <th>Max</th>
                        <th>Min</th>
                        <th>STDEV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyMovesSummary.length > 0 ? (
                        dailyMovesSummary.map((row, idx) => (
                          <tr key={idx} className="pm-row">
                            <td>{row.day_name}</td>
                            <td className={toneClass(row.average)}>{formatPercent(row.average)}</td>
                            <td className={toneClass(row.max)}>{formatPercent(row.max)}</td>
                            <td className={toneClass(row.min)}>{formatPercent(row.min)}</td>
                            <td className={toneClass(row.stdev)}>{formatPercent(row.stdev)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr className="pm-row">
                          <td colSpan="5" className="pm-no-data">
                            {error || "No summary data available"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}