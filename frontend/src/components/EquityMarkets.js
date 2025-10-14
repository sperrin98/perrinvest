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
import "./EquityMarkets.css";

export default function EquityMarkets() {
  const [securities, setSecurities] = useState([]);
  const [equityData, setEquityData] = useState([]);
  const [selectedSecurityName, setSelectedSecurityName] = useState("");
  const [error, setError] = useState("");

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    async function fetchSecurities() {
      try {
        const response = await axios.get(`${API_URL}/equity-markets`);
        setSecurities(response.data);
        if (response.data.length > 0)
          setSelectedSecurityName(response.data[0].security_long_name);
      } catch (err) {
        console.error(err);
        setError("Failed to load securities.");
      }
    }
    fetchSecurities();
  }, [API_URL]);

  const fetchEquityData = async (security_id, security_name) => {
    setSelectedSecurityName(security_name);
    setEquityData([]);
    setError("");

    try {
      const response = await axios.get(`${API_URL}/equity-markets/${security_id}`);
      const data = response.data;
      if (!data || data.length === 0) {
        setError("This security has no equity market data.");
      } else {
        const sorted = data.sort(
          (a, b) => new Date(a.price_date) - new Date(b.price_date)
        );
        setEquityData(sorted);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch equity data.");
    }
  };

  return (
    <div className="em-container">
      <div className="em-sidebar">
        <h2 className="em-sidebar-title">Select Equity Market</h2>
        <ul className="em-security-list">
          {securities.map((sec) => (
            <li
              key={sec.security_id}
              className={`em-security-item ${
                selectedSecurityName === sec.security_long_name
                  ? "em-selected-security"
                  : ""
              }`}
              onClick={() => fetchEquityData(sec.security_id, sec.security_long_name)}
            >
              {sec.security_long_name}
            </li>
          ))}
        </ul>
      </div>

      <div className="em-main">
        {error && <p className="em-error">{error}</p>}

        {selectedSecurityName && equityData.length > 0 && (
          <>
            <h1 className="em-title">{selectedSecurityName}</h1>
            <div className="em-chart-wrapper">
              <ResponsiveContainer width="100%" height="90%">
                <LineChart
                  data={equityData}
                  margin={{ top: 20, right: 50, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="price_date" />
                  <YAxis
                    yAxisId="left"
                    label={{ value: "Price", angle: -90, position: "insideLeft" }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{ value: "Price in Gold", angle: 90, position: "insideRight" }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="price"
                    stroke="#8884d8"
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