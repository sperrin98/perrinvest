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

export default function Commodities() {
  const [commodities, setCommodities] = useState([]);
  const [commodityData, setCommodityData] = useState([]);
  const [selectedCommodityName, setSelectedCommodityName] = useState("");
  const [error, setError] = useState("");

  const API_URL = "http://localhost:5000";

  useEffect(() => {
    async function fetchCommodities() {
      try {
        const response = await axios.get(`${API_URL}/commodities`);
        setCommodities(response.data);
        if (response.data.length > 0) {
          const first = response.data[0];
          setSelectedCommodityName(first.security_long_name);
          fetchCommodityData(first.security_id, first.security_long_name);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load commodities.");
      }
    }
    fetchCommodities();
  }, []);

  const fetchCommodityData = async (security_id, security_name) => {
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

  return (
    <div className="cm-container">
      <div className="cm-sidebar">
        <h2 className="cm-sidebar-title">Select Commodity</h2>
        <ul className="cm-commodity-list">
          {commodities.map((com) => (
            <li
              key={com.security_id}
              className={`cm-commodity-item ${
                selectedCommodityName === com.security_long_name
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

        {selectedCommodityName && commodityData.length > 0 && (
          <>
            <h1 className="cm-title">{selectedCommodityName}</h1>
            <div className="cm-chart-wrapper">
              <ResponsiveContainer width="100%" height="90%">
                <LineChart
                  data={commodityData}
                  margin={{ top: 20, right: 50, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="price_date" />
                  <YAxis
                    yAxisId="left"
                    label={{
                      value: "Price",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{
                      value: "Price in Gold",
                      angle: 90,
                      position: "insideRight",
                    }}
                  />
                  <Tooltip />
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
