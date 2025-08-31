import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import "./PreciousMetals.css";

export default function PreciousMetals() {
  const API_URL = "http://localhost:5000"; // Local Flask backend

  const [metals, setMetals] = useState([]);
  const [selectedMetal, setSelectedMetal] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dailyMoves, setDailyMoves] = useState([]);
  const [error, setError] = useState(null);

  // Fetch metals
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
  }, []);

  // Fetch daily moves
  useEffect(() => {
    if (!selectedMetal) return;

    async function fetchDailyMoves() {
      try {
        const response = await axios.get(`${API_URL}/precious-metals/daily-moves`, {
          params: { id: selectedMetal.security_id, year: selectedYear },
        });
        setDailyMoves(response.data.data || []);
      } catch (err) {
        console.error("Error fetching daily moves:", err);
        setError("Failed to load daily moves.");
      }
    }

    fetchDailyMoves();
  }, [selectedMetal, selectedYear]);

  // Years from current down to 1971
  const years = Array.from({ length: new Date().getFullYear() - 1970 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="pm-container">
      <div className="pm-sidebar">
        <h2 className="pm-sidebar-title">Select Metal</h2>
        <ul className="pm-metal-list">
          {metals.map((metal) => (
            <li
              key={metal.security_id}
              className={`pm-metal-item ${
                selectedMetal?.security_id === metal.security_id ? "pm-selected-metal" : ""
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
          options={years.map((y) => ({ label: y, value: y }))}
          menuPlacement="bottom" // ensures dropdown opens below
          className="pm-year-select"
          classNamePrefix="pm-year-select"
        />
      </div>

      <div className="pm-main">
        {error && <p className="pm-error">{error}</p>}
        {selectedMetal && (
          <>
            <h1 className="pm-title">
              {selectedMetal.security_long_name} - {selectedYear}
            </h1>
            <table className="pm-table">
              <thead>
                <tr className="pm-table-header">
                  <th>YEAR</th>
                  <th>WEEK</th>
                  <th>MONDAY</th>
                  <th>TUESDAY</th>
                  <th>WEDNESDAY</th>
                  <th>THURSDAY</th>
                  <th>FRIDAY</th>
                  <th>WEEK</th>
                </tr>
              </thead>
              <tbody>
                {dailyMoves.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.year}</td>
                    <td>{row.week}</td>
                    <td>{row.monday}%</td>
                    <td>{row.tuesday}%</td>
                    <td>{row.wednesday}%</td>
                    <td>{row.thursday}%</td>
                    <td>{row.friday}%</td>
                    <td className="pm-week-total">{row.week_total}%</td>
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
