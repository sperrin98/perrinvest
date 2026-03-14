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

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const CATEGORY_CONFIG = [
  { key: "nw_hpi", label: "NW HPI" },
  { key: "rates", label: "Rates" },
  { key: "inflation", label: "Inflation" },
  { key: "debt", label: "Debt" },
];

const categorisePoint = (name) => {
  const lower = (name || "").toLowerCase();

  if (
    lower.includes("hpi") ||
    lower.includes("house price") ||
    lower.includes("nationwide")
  ) {
    return "nw_hpi";
  }

  if (
    lower.includes("rate") ||
    lower.includes("bank rate") ||
    lower.includes("base rate") ||
    lower.includes("yield")
  ) {
    return "rates";
  }

  if (
    lower.includes("inflation") ||
    lower.includes("cpi") ||
    lower.includes("rpi") ||
    lower.includes("ppi")
  ) {
    return "inflation";
  }

  if (
    lower.includes("debt") ||
    lower.includes("borrowing") ||
    lower.includes("deficit") ||
    lower.includes("public sector net debt") ||
    lower.includes("psnd")
  ) {
    return "debt";
  }

  return null;
};

const normaliseStandardSeries = (rows) => {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => {
      if (Array.isArray(row)) {
        return {
          price_date: row[0],
          value: row[1],
        };
      }

      return {
        price_date:
          row.price_date ||
          row.date ||
          row.observation_date ||
          row.period_date ||
          null,
        value:
          row.value ??
          row.index_value ??
          row.data_value ??
          row.series_value ??
          row.point_value ??
          null,
      };
    })
    .filter((row) => row.price_date && row.value !== null && row.value !== undefined)
    .sort((a, b) => new Date(a.price_date) - new Date(b.price_date));
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
  const [selectedCategory, setSelectedCategory] = useState("nw_hpi");
  const [ecoError, setEcoError] = useState("");

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    async function fetchEcoDataPoints() {
      try {
        const response = await axios.get(`${API_URL}/eco-data-points`);
        const points = response.data || [];
        setEcoDataPoints(points);

        const grouped = CATEGORY_CONFIG.reduce((acc, category) => {
          acc[category.key] = points.filter(
            (point) => categorisePoint(point.eco_data_point_name) === category.key
          );
          return acc;
        }, {});

        const firstCategoryWithData =
          CATEGORY_CONFIG.find((category) => grouped[category.key]?.length > 0)?.key ||
          "nw_hpi";

        setSelectedCategory(firstCategoryWithData);

        const firstPoint = grouped[firstCategoryWithData]?.[0];
        if (firstPoint) {
          fetchEcoDataPointChartData(
            firstPoint.eco_data_point_id,
            firstPoint.eco_data_point_name,
            firstCategoryWithData
          );
        }
      } catch (err) {
        console.error(err);
        setEcoError("Failed to load eco data points.");
      }
    }

    fetchEcoDataPoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL]);

  const fetchEcoDataPointChartData = async (
    ecoDataPointId,
    ecoDataPointName,
    category
  ) => {
    setSelectedEcoDataPointId(ecoDataPointId);
    setSelectedEcoDataPointName(ecoDataPointName);
    setSelectedCategory(category);
    setEcoChartData([]);
    setEcoError("");

    try {
      if (category === "nw_hpi") {
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
        return;
      }

      let response;
      try {
        response = await axios.get(`${API_URL}/eco-data-point-series`, {
          params: { data_point_id: ecoDataPointId },
        });
      } catch (firstErr) {
        response = await axios.get(`${API_URL}/eco-data-points/${ecoDataPointId}`);
      }

      const data = normaliseStandardSeries(response.data);

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

  const groupedPoints = useMemo(() => {
    return CATEGORY_CONFIG.reduce((acc, category) => {
      acc[category.key] = ecoDataPoints.filter(
        (point) => categorisePoint(point.eco_data_point_name) === category.key
      );
      return acc;
    }, {});
  }, [ecoDataPoints]);

  const visiblePoints = groupedPoints[selectedCategory] || [];

  const chartTitle = useMemo(() => {
    return selectedEcoDataPointName || "Economic Data";
  }, [selectedEcoDataPointName]);

  const isHpiCategory = selectedCategory === "nw_hpi";

  const chartData = useMemo(() => {
    return ecoChartData;
  }, [ecoChartData]);

  return (
    <div className="edp-container">
      <aside className="edp-sidebar">
        <h2 className="edp-sidebar-title">Charts</h2>

        <div className="edp-category-list">
          {CATEGORY_CONFIG.map((category) => (
            <button
              key={category.key}
              type="button"
              className={`edp-category-item ${
                selectedCategory === category.key ? "edp-category-item-active" : ""
              }`}
              onClick={() => {
                setSelectedCategory(category.key);
                const firstPoint = groupedPoints[category.key]?.[0];
                if (firstPoint) {
                  fetchEcoDataPointChartData(
                    firstPoint.eco_data_point_id,
                    firstPoint.eco_data_point_name,
                    category.key
                  );
                } else {
                  setSelectedEcoDataPointId(null);
                  setSelectedEcoDataPointName("");
                  setEcoChartData([]);
                }
              }}
            >
              {category.label}
            </button>
          ))}
        </div>

        <h2 className="edp-sidebar-title">Series</h2>

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
                    point.eco_data_point_name,
                    selectedCategory
                  )
                }
              >
                {point.eco_data_point_name}
              </li>
            ))
          ) : (
            <li className="edp-empty-item">No series available in this section.</li>
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
                <div className="edp-chart-kicker">
                  {CATEGORY_CONFIG.find((c) => c.key === selectedCategory)?.label}
                </div>
                <div className="edp-chart-name">{selectedEcoDataPointName}</div>
              </div>
            </div>

            <div className="edp-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 50, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="price_date" tickFormatter={formatDate} />

                  {isHpiCategory ? (
                    <>
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
                        stroke="#FF4C4C"
                        dot={false}
                        name="NW HPI Index"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="HPI_gold_index"
                        stroke="#00796b"
                        dot={false}
                        name="NW HPI Gold Index"
                      />
                    </>
                  ) : (
                    <>
                      <YAxis
                        yAxisId="left"
                        label={{
                          value: "Value",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip labelFormatter={formatDate} />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="value"
                        stroke="#00796b"
                        dot={false}
                        name={selectedEcoDataPointName || "Value"}
                      />
                    </>
                  )}
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