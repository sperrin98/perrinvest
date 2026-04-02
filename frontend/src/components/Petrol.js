import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./Petrol.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Petrol = () => {
  const API_URL = process.env.REACT_APP_API_URL;

  const [meta36, setMeta36] = useState(null);
  const [meta37, setMeta37] = useState(null);
  const [series36, setSeries36] = useState([]);
  const [series37, setSeries37] = useState([]);
  const [selectedId, setSelectedId] = useState(36);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) {
      return String(dateString).replace(/-/g, "/");
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  useEffect(() => {
    const fetchPetrolData = async () => {
      try {
        setLoading(true);
        setError("");

        const [metaRes36, metaRes37, histRes36, histRes37] = await Promise.all([
          axios.get(`${API_URL}/eco-data-points/36`),
          axios.get(`${API_URL}/eco-data-points/37`),
          axios.get(`${API_URL}/eco-data-points/36/histories`),
          axios.get(`${API_URL}/eco-data-points/37/histories`),
        ]);

        const metaData36 = Array.isArray(metaRes36.data)
          ? metaRes36.data[0]
          : metaRes36.data || null;

        const metaData37 = Array.isArray(metaRes37.data)
          ? metaRes37.data[0]
          : metaRes37.data || null;

        const historyData36 = Array.isArray(histRes36.data)
          ? histRes36.data
          : Array.isArray(histRes36.data?.data)
          ? histRes36.data.data
          : [];

        const historyData37 = Array.isArray(histRes37.data)
          ? histRes37.data
          : Array.isArray(histRes37.data?.data)
          ? histRes37.data.data
          : [];

        setMeta36(metaData36);
        setMeta37(metaData37);
        setSeries36(historyData36);
        setSeries37(historyData37);
      } catch (err) {
        console.error("Error fetching petrol data:", err);
        setError("Failed to load UK petrol price data.");
      } finally {
        setLoading(false);
      }
    };

    fetchPetrolData();
  }, [API_URL]);

  const normaliseSeries = (series) => {
    return series
      .map((item) => {
        const rawDate = item.price_date || "";
        const value = Number(item.price);

        return {
          ...item,
          displayDate: formatDate(rawDate),
          sortDate: rawDate,
          displayValue: Number.isNaN(value) ? null : value,
        };
      })
      .filter((item) => item.sortDate && item.displayValue !== null)
      .sort((a, b) => new Date(a.sortDate) - new Date(b.sortDate));
  };

  const formatted36 = useMemo(() => normaliseSeries(series36), [series36]);
  const formatted37 = useMemo(() => normaliseSeries(series37), [series37]);

  const selectedSeries = selectedId === 36 ? formatted36 : formatted37;
  const selectedMeta = selectedId === 36 ? meta36 : meta37;

  const selectedName =
    selectedMeta?.eco_data_point_name || `Eco Data Point ${selectedId}`;

  const latestValue =
    selectedSeries.length > 0
      ? selectedSeries[selectedSeries.length - 1].displayValue
      : null;

  const earliestDate =
    selectedSeries.length > 0 ? selectedSeries[0].displayDate : "N/A";

  const latestDate =
    selectedSeries.length > 0
      ? selectedSeries[selectedSeries.length - 1].displayDate
      : "N/A";

  const chartData = useMemo(() => {
    return {
      labels: selectedSeries.map((item) => item.displayDate),
      datasets: [
        {
          label: selectedName,
          data: selectedSeries.map((item) => item.displayValue),
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.15,
        },
      ],
    };
  }, [selectedSeries, selectedName]);

  const chartOptions = useMemo(() => {
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
          position: "top",
        },
        title: {
          display: true,
          text: selectedName,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${selectedName}: ${context.parsed.y}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 10,
          },
        },
        y: {
          title: {
            display: true,
            text: "Price",
          },
        },
      },
    };
  }, [selectedName]);

  if (loading) {
    return (
      <div className="petrol-page">
        <h1>UK Petrol Prices</h1>
        <p>Loading petrol data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="petrol-page">
        <h1>UK Petrol Prices</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="petrol-page">
      <div className="petrol-header">
        <h1>UK Petrol Prices</h1>
        <p>Select a series to view its chart.</p>
      </div>

      <div className="petrol-button-row">
        <button
          type="button"
          className={`petrol-toggle-button ${selectedId === 36 ? "active" : ""}`}
          onClick={() => setSelectedId(36)}
        >
          {meta36?.eco_data_point_name || "Series 36"}
        </button>

        <button
          type="button"
          className={`petrol-toggle-button ${selectedId === 37 ? "active" : ""}`}
          onClick={() => setSelectedId(37)}
        >
          {meta37?.eco_data_point_name || "Series 37"}
        </button>
      </div>

      <div className="petrol-summary-cards">
        <div className="petrol-summary-card">
          <h3>Series Name</h3>
          <p>{selectedName}</p>
        </div>

        <div className="petrol-summary-card">
          <h3>Latest Value</h3>
          <p>{latestValue !== null ? latestValue : "N/A"}</p>
        </div>

        <div className="petrol-summary-card">
          <h3>Date Range</h3>
          <p>
            {earliestDate} - {latestDate}
          </p>
        </div>
      </div>

      <div className="petrol-chart-card">
        <div className="petrol-chart-wrapper">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default Petrol;