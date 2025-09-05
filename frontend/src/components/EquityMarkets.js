import React, { useState, useEffect } from "react";

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
          setEquityData(data);
        }
      })
      .catch(() => setError("Failed to fetch equity data"));
  };

  return (
    <div>
      <h1>Equity Markets Priced in Gold</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <h2>Available Securities</h2>
      <table border="1">
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

      {selectedSecurity && (
        <div>
          <h2>Equity Data for Security {selectedSecurity}</h2>
          {equityData.length > 0 ? (
            <table border="1">
              <thead>
                <tr>
                  <th>Security ID</th>
                  <th>Price Date</th>
                  <th>Price</th>
                  <th>Price in Gold</th>
                </tr>
              </thead>
              <tbody>
                {equityData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.security_id}</td>
                    <td>{row.price_date}</td>
                    <td>{row.price}</td>
                    <td>{row.price_in_gold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No equity data loaded.</p>
          )}
        </div>
      )}
    </div>
  );
}
