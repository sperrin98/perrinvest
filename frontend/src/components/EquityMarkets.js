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

const API_URL = "http://localhost:5000";

export default function EquityMarkets() {
  const [securities, setSecurities] = useState([]);
  const [equityData, setEquityData] = useState([]);
  const [selectedSecurity, setSelectedSecurity] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/equity-markets`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setSecurities(data);
        }
      })
      .catch(() => setError("Failed to fetch securities list"));
  }, []);

  const fetchEquityData = (security_id) => {
    setSelectedSecurity(security_id);
    setError("");
    setEquityData([]);

    fetch(`${API_URL}/equity-markets/${security_id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else if (!data || data.length === 0) {
          setError("This security has no equity market data.");
        } else {
          // Sort by price_date ascending
          const sorted = data.sort(
            (a, b) => new Date(a.price_date) - new Date(b.price_date)
          );
          setEquityData(sorted);
        }
      })
      .catch(() => setError("Failed to fetch equity data"));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Equity Markets Priced in Gold</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>Available Securities</h2>
      <table border="1" style={{ marginBottom: "20px" }}>
        <thead>
          <tr>
            <th>Security ID</th>
            <th>Security Name</th>
          </tr>
        </thead>
        <tbody>
          {securities.map((sec) => (
            <tr
              key={sec.security_id}
              onClick={() => fetchEquityData(sec.security_id)}
              style={{ cursor: "pointer" }}
            >
              <td>{sec.security_id}</td>
              <td>{sec.security_long_name}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedSecurity && equityData.length > 0 && (
        <div>
          <h2>Equity Data for Security {selectedSecurity}</h2>
          <ResponsiveContainer width="100%" height={400}>
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
                stroke="#8884d8"
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="price_in_gold"
                stroke="#82ca9d"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
