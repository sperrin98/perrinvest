import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Select from "react-select";
import "./MonthlyReturns.css";

export default function MonthlyReturns() {
  const [metals, setMetals] = useState([]);
  const [selectedMetal, setSelectedMetal] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL;

  const MONTH_ORDER = useMemo(
    () => [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER",
    ],
    []
  );

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

    async function fetchMonthlyReturns() {
      try {
        const response = await axios.get(
          `${API_URL}/precious-metals/monthly-returns`,
          { params: { id: selectedMetal.security_id } }
        );
        const data = response.data.data || [];
        setMonthlyData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching monthly returns:", err);
        setMonthlyData([]);
        setError("Failed to load monthly returns.");
      }
    }

    fetchMonthlyReturns();
  }, [selectedMetal, API_URL]);

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

  const formatPercent = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "";
    return `${(value * 100).toFixed(2)}%`;
  };

  const toneClass = (value) => {
    if (value > 0) return "monthly-positive";
    if (value < 0) return "monthly-negative";
    if (value === 0) return "monthly-neutral";
    return "";
  };

  const calculateAnnualReturn = (row) => {
    const monthlyValues = MONTH_ORDER.map((month) => row[month]).filter(
      (value) => value !== null && value !== undefined && !Number.isNaN(value)
    );

    if (monthlyValues.length === 0) return null;

    const compounded = monthlyValues.reduce(
      (acc, value) => acc * (1 + value),
      1
    );

    return compounded - 1;
  };

  return (
    <div className="monthly-container">
      <aside className="monthly-sidebar">
        <div className="monthly-desktop-controls">
          <h2 className="monthly-sidebar-title">Select Metal</h2>

          <ul className="monthly-metal-list">
            {metals.map((metal) => (
              <li
                key={metal.security_id}
                className={`monthly-metal-item ${
                  selectedMetal?.security_id === metal.security_id
                    ? "monthly-selected-metal"
                    : ""
                }`}
                onClick={() => setSelectedMetal(metal)}
              >
                {metal.security_long_name}
              </li>
            ))}
          </ul>
        </div>

        <div className="monthly-mobile-controls-card">
          <div className="monthly-mobile-controls-title">Metal</div>
          <div className="monthly-mobile-controls-subtitle">
            Choose a precious metal
          </div>

          <Select
            value={selectedMetalOption}
            onChange={(option) => setSelectedMetal(option.metal)}
            options={metalOptions}
            menuPlacement="auto"
            className="monthly-metal-select"
            classNamePrefix="monthly-metal-select"
            isSearchable={false}
          />
        </div>
      </aside>

      <main className="monthly-main">
        <div className="monthly-main-inner">
          {error && <p className="monthly-error">{error}</p>}

          {selectedMetal && (
            <>
              <h1 className="monthly-title">
                {selectedMetal.security_long_name} - Monthly Returns
              </h1>

              <section className="monthly-table-card">
                <div className="monthly-table-card-header">
                  <div className="monthly-table-heading">Monthly Returns</div>
                  <div className="monthly-table-meta">
                    {monthlyData.length} {monthlyData.length === 1 ? "year" : "years"}
                  </div>
                </div>

                <div className="monthly-mobile-scroll-hint">
                  Swipe sideways to view full table
                </div>

                <div className="monthly-table-wrapper">
                  <table className="monthly-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        {MONTH_ORDER.map((month) => (
                          <th key={month}>{month}</th>
                        ))}
                        <th>ANNUAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.length > 0 ? (
                        monthlyData.map((row, idx) => {
                          const annualReturn = calculateAnnualReturn(row);

                          return (
                            <tr key={idx} className="monthly-row">
                              <td>{row.YR ?? row.yr ?? row.year}</td>

                              {MONTH_ORDER.map((month) => (
                                <td key={month} className={toneClass(row[month])}>
                                  {formatPercent(row[month])}
                                </td>
                              ))}

                              <td className={toneClass(annualReturn)}>
                                {formatPercent(annualReturn)}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr className="monthly-row">
                          <td colSpan={14} className="monthly-no-data">
                            {error || "No data available"}
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