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
import "./Commodities.css";

// Format date as DD/MM/YYYY
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function Commodities() {
  const [commodities, setCommodities] = useState([]);
  const [commodityData, setCommodityData] = useState([]);
  const [selectedCommodityName, setSelectedCommodityName] = useState("");
  const [selectedCommodityId, setSelectedCommodityId] = useState(null);
  const [error, setError] = useState("");

  const API_URL = process.env.REACT_APP_API_URL;

  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  const [startDate, setStartDate] = useState(
    tenYearsAgo.toISOString().split("T")[0]
  );

  useEffect(() => {
    async function fetchCommodities() {
      try {
        const response = await axios.get(`${API_URL}/commodities`);
        setCommodities(response.data);
        if (response.data.length > 0) {
          const first = response.data[0];
          fetchCommodityData(first.security_id, first.security_long_name);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load commodities.");
      }
    }
    fetchCommodities();
  }, [API_URL]);

  const fetchCommodityData = async (security_id, security_name) => {
    setSelectedCommodityId(security_id);
    setSelectedCommodityName(security_name);
    setCommodityData([]);
    setError("");

    try {
      const response = await axios.get(`${API_URL}/commodities/${security_id}`);
      const data = response.data;
      if (!data || data.length === 0) {
        setError("This commodity has no price data.");
      } else {
        const sorted = data.sort(
          (a, b) => new Date(a.price_date) - new Date(b.price_date)
        );
        setCommodityData(sorted);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch commodity data.");
    }
  };

  // Corrected filtering using Date objects
  const filteredData = commodityData.filter(
    (d) => new Date(d.price_date) >= new Date(startDate)
  );

  return (
    <div className="cm-container">
      <div className="cm-sidebar">
        <div className="cm-date-filter">
          <label htmlFor="start-date">Start Date:</label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <h2 className="cm-sidebar-title">Select Commodity</h2>
        <ul className="cm-commodity-list">
          {commodities.map((com) => (
            <li
              key={com.security_id}
              className={`cm-commodity-item ${
                selectedCommodityId === com.security_id
                  ? "cm-selected-commodity"
                  : ""
              }`}
              onClick={() =>
                fetchCommodityData(com.security_id, com.security_long_name)
              }
            >
              {com.security_long_name}
            </li>
          ))}
        </ul>
      </div>

      <div className="cm-main">
        {error && <p className="cm-error">{error}</p>}

        {selectedCommodityName && filteredData.length > 0 && (
          <>
            <h1 className="cm-title">{selectedCommodityName}</h1>
            <div className="cm-chart-wrapper">
              <ResponsiveContainer width="100%" height="90%">
                <LineChart
                  data={filteredData}
                  margin={{ top: 20, right: 50, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="price_date"
                    tickFormatter={formatDate}
                  />
                  <YAxis
                    yAxisId="left"
                    label={{ value: "Price", angle: -90, position: "insideLeft" }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{ value: "Price in Gold", angle: 90, position: "insideRight" }}
                  />
                  <Tooltip labelFormatter={formatDate} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="price"
                    stroke="#FF4C4C"
                    dot={false}
                    name="Price"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="price_in_gold"
                    stroke="#00796b"
                    dot={false}
                    name="Price in Gold"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
