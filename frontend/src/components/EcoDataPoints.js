import React, { useState, useEffect, useMemo } from "react";
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

const NW_HPI_IDS = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const normaliseHpiSeries = (rows) => {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => ({
      price_date: row.price_date,
      HPI_index: row.HPI_index,
      HPI_gold_index: row.HPI_gold_index,
    }))
    .filter((row) => row.price_date)
    .sort((a, b) => new Date(a.price_date) - new Date(b.price_date));
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
        const points = (response.data || [])
          .filter((point) => NW_HPI_IDS.has(point.eco_data_point_id))
          .sort((a, b) => a.eco_data_point_id - b.eco_data_point_id);

        setEcoDataPoints(points);

        const firstPoint = points[0];
        if (firstPoint) {
          fetchEcoDataPointChartData(
            firstPoint.eco_data_point_id,
            firstPoint.eco_data_point_name
          );
        }
      } catch (err) {
        console.error(err);
        setEcoError("Failed to load eco data points.");
      }
    }

    fetchEcoDataPoints();
  }, [API_URL]);

  const fetchEcoDataPointChartData = async (
    ecoDataPointId,
    ecoDataPointName
  ) => {
    setSelectedEcoDataPointId(ecoDataPointId);
    setSelectedEcoDataPointName(ecoDataPointName);
    setEcoChartData([]);
    setEcoError("");

    try {
      const response = await axios.get(
        `${API_URL}/hpi-and-priced-in-gold-rebased-to-100`,
        { params: { data_point_id: ecoDataPointId } }
      );

      const data = normaliseHpiSeries(response.data);

      if (!data.length) {
        setEcoError("This eco data point has no data.");
        return;
      }

      setEcoChartData(data);
    } catch (err) {
      console.error(err);
      setEcoError("Failed to fetch eco data point data.");
    }
  };

  const visiblePoints = useMemo(() => ecoDataPoints, [ecoDataPoints]);
  const chartTitle = useMemo(
    () => selectedEcoDataPointName || "NW HPI",
    [selectedEcoDataPointName]
  );
  const chartData = useMemo(() => ecoChartData, [ecoChartData]);

  return (
    <div className="edp-container">
      <aside className="edp-sidebar">
        <h2 className="edp-sidebar-title">NW HPI Series</h2>

        <ul className="edp-point-list">
          {visiblePoints.length > 0 ? (
            visiblePoints.map((point) => (
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
            ))
          ) : (
            <li className="edp-empty-item">No NW HPI series available.</li>
          )}
        </ul>
      </aside>

      <div className="edp-main">
        {ecoError && <p className="edp-error">{ecoError}</p>}

        <h1 className="edp-title">{chartTitle}</h1>

        {chartData.length > 0 ? (
          <div className="edp-chart-card">
            <div className="edp-chart-header">
              <div>
                <div className="edp-chart-kicker">NW HPI</div>
                <div className="edp-chart-name">{selectedEcoDataPointName}</div>
              </div>
            </div>

            <div className="edp-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 28, left: 8, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                  <XAxis dataKey="price_date" tickFormatter={formatDate} />
                  <YAxis
                    yAxisId="left"
                    label={{
                      value: "NW HPI Index",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{
                      value: "NW HPI Gold Index",
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
                    stroke="#e84d4d"
                    strokeWidth={1.5}
                    dot={false}
                    name="NW HPI Index"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="HPI_gold_index"
                    stroke="#00796b"
                    strokeWidth={1.5}
                    dot={false}
                    name="NW HPI Gold Index"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="edp-empty-state">
            <p>Select a series from the left to view the chart.</p>
          </div>
        )}
      </div>
    </div>
  );
}