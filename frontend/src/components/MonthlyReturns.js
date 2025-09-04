import React, { useState, useEffect } from "react";
import axios from "axios";
import "./MonthlyReturns.css";

export default function MonthlyReturns() {
  const [metals, setMetals] = useState([]);
  const [selectedMetal, setSelectedMetal] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [error, setError] = useState(null);

  // Use the API URL from the environment variable
  const API_URL = process.env.REACT_APP_API_URL;

  const MONTH_ORDER = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  // Fetch metals for the sidebar
  useEffect(() => {
    async function fetchMetals() {
      try {
        const response = await axios.get(`${API_URL}/precious-metals`);
        setMetals(response.data.data);
        if (response.data.data.length > 0) setSelectedMetal(response.data.data[0]);
      } catch (err) {
        console.error("Error fetching metals:", err);
        setError("Failed to load metals.");
      }
    }
    fetchMetals();
  }, [API_URL]);

  // Fetch monthly returns for selected metal
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
      } catch (err) {
        console.error("Error fetching monthly returns:", err);
        setError("Failed to load monthly returns.");
      }
    }

    fetchMonthlyReturns();
  }, [selectedMetal, API_URL]);

  return (
    <div className="monthly-container">
      <div className="monthly-sidebar">
        <h2 className="monthly-sidebar-title">Select Metal</h2>
        <ul className="monthly-metal-list">
          {metals.map((metal) => (
            <li
              key={metal.security_id}
              className={`monthly-metal-item ${
                selectedMetal?.security_id === metal.security_id ? "monthly-selected-metal" : ""
              }`}
              onClick={() => setSelectedMetal(metal)}
            >
              {metal.security_long_name}
            </li>
          ))}
        </ul>
      </div>

      <div className="monthly-main">
        {error && <p className="monthly-error">{error}</p>}
        {selectedMetal && (
          <>
            <h1 className="monthly-title">{selectedMetal.security_long_name} - Monthly Returns</h1>
            <table className="monthly-table">
              <thead>
                <tr className="monthly-table-header">
                  <th>YEAR</th>
                  {MONTH_ORDER.map((month) => (
                    <th key={month}>{month}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row, idx) => (
                  <tr key={idx}>
                    {/* YEAR column */}
                    <td>{row.YR ?? row.yr ?? row.year}</td>

                    {/* Months columns */}
                    {MONTH_ORDER.map((month) => (
                      <td
                        key={month}
                        className={
                          row[month] != null
                            ? row[month] < 0
                              ? "negative"
                              : "positive"
                            : ""
                        }
                      >
                        {row[month] != null ? (row[month] * 100).toFixed(2) + "%" : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
