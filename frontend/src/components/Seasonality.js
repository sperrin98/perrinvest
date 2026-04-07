// Seasonality.js

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "./Seasonality.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
);

const API_URL = process.env.REACT_APP_API_URL;

const monthLabels = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const formatDateLabel = (dateString) => {
  const d = new Date(dateString);
  if (isNaN(d)) return dateString;
  return `${monthLabels[d.getMonth()]} ${d.getDate()}`;
};

const Seasonality = () => {
  const [securities, setSecurities] = useState([]);
  const [assetClass, setAssetClass] = useState("");
  const [selectedSecurityId, setSelectedSecurityId] = useState("");
  const [startDate, setStartDate] = useState("2010-01-01");
  const [chartData, setChartData] = useState([]);
  const [loadingSecurities, setLoadingSecurities] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSecurities = async () => {
      try {
        setLoadingSecurities(true);
        setError("");

        const response = await axios.get(`${API_URL}/seasonality-securities`);
        setSecurities(response.data || []);
      } catch (err) {
        console.error("Error fetching seasonality securities:", err);
        setError("Failed to load seasonality securities.");
      } finally {
        setLoadingSecurities(false);
      }
    };

    fetchSecurities();
  }, []);

  const assetClasses = useMemo(() => {
    const classes = [
      ...new Set(
        securities
          .map((security) => security.asset_class_name)
          .filter(Boolean)
      ),
    ];
    return classes.sort();
  }, [securities]);

  const filteredSecurities = useMemo(() => {
    if (!assetClass) return [];
    return securities.filter(
      (security) => security.asset_class_name === assetClass
    );
  }, [securities, assetClass]);

  const selectedSecurity = useMemo(() => {
    return securities.find(
      (security) => String(security.security_id) === String(selectedSecurityId)
    );
  }, [securities, selectedSecurityId]);

  useEffect(() => {
    if (!assetClass) {
      setSelectedSecurityId("");
      setChartData([]);
      return;
    }

    const matchingSecurities = securities.filter(
      (security) => security.asset_class_name === assetClass
    );

    if (
      matchingSecurities.length > 0 &&
      !matchingSecurities.some(
        (security) => String(security.security_id) === String(selectedSecurityId)
      )
    ) {
      setSelectedSecurityId(String(matchingSecurities[0].security_id));
    }
  }, [assetClass, securities, selectedSecurityId]);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!selectedSecurityId) {
        setChartData([]);
        return;
      }

      try {
        setLoadingChart(true);
        setError("");

        const response = await axios.get(
          `${API_URL}/seasonality/${selectedSecurityId}`,
          {
            params: {
              start_date: startDate,
            },
          }
        );

        setChartData(response.data || []);
      } catch (err) {
        console.error("Error fetching seasonality chart:", err);
        setError("Failed to load seasonality chart.");
        setChartData([]);
      } finally {
        setLoadingChart(false);
      }
    };

    fetchChartData();
  }, [selectedSecurityId, startDate]);

  const lineData = useMemo(() => {
    return {
      labels: chartData.map((row) => formatDateLabel(row.calendar_date)),
      datasets: [
        {
          label: "Seasonality Index",
          data: chartData.map((row) => row.seasonal_index_base_100),
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.15,
        },
      ],
    };
  }, [chartData]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
        },
        title: {
          display: true,
          text: selectedSecurity
            ? `${selectedSecurity.security_long_name} Seasonality`
            : "Seasonality",
        },
        tooltip: {
          callbacks: {
            afterLabel: function (context) {
              const idx = context.dataIndex;
              const row = chartData[idx];
              if (!row) return "";
              return `Avg Daily Return: ${row.avg_daily_ret_pct}%`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 12,
          },
        },
        y: {
          title: {
            display: true,
            text: "Seasonality Index (Base 100)",
          },
        },
      },
    };
  }, [selectedSecurity, chartData]);

  return (
    <div className="seasonality-page">
      <div className="seasonality-header">
        <h1>Seasonality</h1>
        <p>Select an asset class, then choose a security to view its seasonal curve.</p>
      </div>

      <div className="seasonality-controls">
        <div className="seasonality-control-group">
          <label htmlFor="asset-class">Asset Class</label>
          <select
            id="asset-class"
            value={assetClass}
            onChange={(e) => setAssetClass(e.target.value)}
          >
            <option value="">Select asset class</option>
            {assetClasses.map((ac) => (
              <option key={ac} value={ac}>
                {ac}
              </option>
            ))}
          </select>
        </div>

        <div className="seasonality-control-group">
          <label htmlFor="start-date">Start Date</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
      </div>

      {loadingSecurities ? (
        <div className="seasonality-message">Loading securities...</div>
      ) : (
        <>
          {assetClass && (
            <div className="seasonality-security-list">
              <h2>{assetClass}</h2>
              <div className="seasonality-security-buttons">
                {filteredSecurities.map((security) => (
                  <button
                    key={security.security_id}
                    className={
                      String(selectedSecurityId) === String(security.security_id)
                        ? "seasonality-security-button active"
                        : "seasonality-security-button"
                    }
                    onClick={() => setSelectedSecurityId(String(security.security_id))}
                  >
                    {security.security_long_name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {error && <div className="seasonality-error">{error}</div>}

      {selectedSecurity && (
        <div className="seasonality-selected-card">
          <h3>{selectedSecurity.security_long_name}</h3>
          <p>Short Name: {selectedSecurity.security_short_name || "-"}</p>
          <p>Asset Class: {selectedSecurity.asset_class_name || "-"}</p>
          <p>Start Date: {startDate}</p>
        </div>
      )}

      <div className="seasonality-chart-card">
        {loadingChart ? (
          <div className="seasonality-message">Loading chart...</div>
        ) : chartData.length > 0 ? (
          <div className="seasonality-chart-wrapper">
            <Line data={lineData} options={options} />
          </div>
        ) : (
          <div className="seasonality-message">
            Select an asset class and security to load seasonality data.
          </div>
        )}
      </div>
    </div>
  );
};

export default Seasonality;