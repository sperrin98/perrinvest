import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import "./EcoDataPoints.css";

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function EcoDataPoints() {
  const [ecoDataPoints, setEcoDataPoints] = useState([]);
  const [ecoChartData, setEcoChartData] = useState([]);
  const [selectedEcoDataPointName, setSelectedEcoDataPointName] = useState("");
  const [selectedEcoDataPointId, setSelectedEcoDataPointId] = useState(null);
  const [ecoError, setEcoError] = useState("");

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    async function fetchEcoDataPoints() {
      try {
        const response = await axios.get(`${API_URL}/eco-data-points`);
        setEcoDataPoints(response.data || []);
      } catch (err) {
        console.error(err);
        setEcoError("Failed to load eco data points.");
      }
    }

    fetchEcoDataPoints();
  }, [API_URL]);

  const fetchEcoDataPointChartData = async (ecoDataPointId, ecoDataPointName) => {
    setSelectedEcoDataPointId(ecoDataPointId);
    setSelectedEcoDataPointName(ecoDataPointName);
    setEcoChartData([]);
    setEcoError("");

    try {
      const response = await axios.get(
        `${API_URL}/hpi-and-priced-in-gold-rebased-to-100`,
        { params: { data_point_id: ecoDataPointId } }
      );

      const data = response.data;

      if (!data || data.length === 0) {
        setEcoError("This eco data point has no data.");
        return;
      }

      const sorted = [...data].sort(
        (a, b) => new Date(a.price_date) - new Date(b.price_date)
      );

      setEcoChartData(sorted);
    } catch (err) {
      console.error(err);
      setEcoError("Failed to fetch eco data point data.");
    }
  };

  const hasSelection = selectedEcoDataPointId !== null;

  return (
    <div className="edp-container">
      <div className="edp-sidebar">
        <h2 className="edp-sidebar-title">Select Eco Data Point</h2>

        <ul className="edp-point-list">
          {ecoDataPoints.map((point) => (
            <li
              key={point.eco_data_point_id}
              className={`edp-point-item ${
                selectedEcoDataPointId === point.eco_data_point_id
                  ? "edp-selected-point"
                  : ""
              }`}
              onClick={() =>
                fetchEcoDataPointChartData(
                  point.eco_data_point_id,
                  point.eco_data_point_name
                )
              }
            >
              {point.eco_data_point_name}
            </li>
          ))}
        </ul>
      </div>

      <div className="edp-main">
        {!hasSelection && (
          <div className="edp-empty-state">
            <p>Select an eco data point from the left to view the chart.</p>
          </div>
        )}

        {hasSelection && (
          <>
            {ecoError && <p className="edp-error">{ecoError}</p>}

            {selectedEcoDataPointName && (
              <h1 className="edp-title">{selectedEcoDataPointName}</h1>
            )}

            {ecoChartData.length > 0 && (
              <div className="edp-chart-wrapper">
                <ResponsiveContainer width="100%" height="90%">
                  <LineChart
                    data={ecoChartData}
                    margin={{ top: 20, right: 50, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="price_date" tickFormatter={formatDate} />
                    <YAxis
                      yAxisId="left"
                      label={{
                        value: "HPI Index",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{
                        value: "HPI Priced in Gold Index",
                        angle: 90,
                        position: "insideRight",
                      }}
                    />
                    <Tooltip labelFormatter={formatDate} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="HPI_index"
                      stroke="#FF4C4C"
                      dot={false}
                      name="HPI Index"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="HPI_gold_index"
                      stroke="#00796b"
                      dot={false}
                      name="HPI Priced in Gold Index"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}