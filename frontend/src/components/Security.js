// Security.js
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import './Security.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

const Security = () => {
  const { id } = useParams();
  const [security, setSecurity] = useState(null);

  const [priceHistories, setPriceHistories] = useState([]);
  const [movingAverages, setMovingAverages] = useState({
    '5d': [],
    '40d': [],
    '200d': []
  });

  const [selectedAverage, setSelectedAverage] = useState(null);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('daily');
  const [isLogScale, setIsLogScale] = useState(false);

  // Viewport controls (we DO NOT slice the dataset; we move the visible window)
  const [windowSize, setWindowSize] = useState(0);
  const [windowStart, setWindowStart] = useState(0);

  useEffect(() => {
    const fetchSecurity = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/securities/${id}`);
        setSecurity(response.data.security);
      } catch (error) {
        console.error('Error fetching security:', error);
      }
    };

    const fetchPriceHistories = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/securities/${id}/price-histories`);
        const formatted = response.data.map(history => ({
          date: new Date(history[1]).toISOString().split('T')[0],
          price: history[2],
        }));

        formatted.sort((a, b) => new Date(a.date) - new Date(b.date));
        setPriceHistories(formatted);
      } catch (error) {
        console.error('Error fetching price histories:', error);
      }
    };

    const fetchMovingAverages = async () => {
      try {
        const movingAveragesData = {};

        const response5d = await axios.get(`${process.env.REACT_APP_API_URL}/securities/${id}/5d-moving-average`);
        movingAveragesData['5d'] = response5d.data.map(item => ({
          date: new Date(item.price_date).toISOString().split('T')[0],
          movingAverage: item['5d_moving_average'],
        }));

        const response40d = await axios.get(`${process.env.REACT_APP_API_URL}/securities/${id}/40d-moving-average`);
        movingAveragesData['40d'] = response40d.data.map(item => ({
          date: new Date(item.price_date).toISOString().split('T')[0],
          movingAverage: item['40d_moving_average'],
        }));

        const response200d = await axios.get(`${process.env.REACT_APP_API_URL}/securities/${id}/200d-moving-average`);
        movingAveragesData['200d'] = response200d.data.map(item => ({
          date: new Date(item.price_date).toISOString().split('T')[0],
          movingAverage: item['200d_moving_average'],
        }));

        Object.keys(movingAveragesData).forEach(k => {
          movingAveragesData[k].sort((a, b) => new Date(a.date) - new Date(b.date));
        });

        setMovingAverages(movingAveragesData);
      } catch (error) {
        console.error('Error fetching moving averages:', error);
      }
    };

    fetchSecurity();
    fetchPriceHistories();
    fetchMovingAverages();
  }, [id]);

  const securityLongName = security?.[1];

  // Resample the *view* (still continuous) from the daily series
  const resampleStep = (tf) => {
    switch (tf) {
      case 'daily': return 1;
      case 'weekly': return 5;      // ~5 trading days
      case 'monthly': return 21;    // ~21 trading days
      case 'quarterly': return 63;  // ~63 trading days
      default: return 1;
    }
  };

  // Default visible window sizes (in points after resampling)
  const defaultWindowPoints = (tf) => {
    switch (tf) {
      case 'daily': return 252;                   // ~1y
      case 'weekly': return 260;                  // ~5y (52*5)
      case 'monthly': return 120;                 // ~10y
      case 'quarterly': return Number.POSITIVE_INFINITY; // inception
      default: return 252;
    }
  };

  const series = useMemo(() => {
    if (!priceHistories.length) return [];
    const step = resampleStep(selectedTimeFrame);
    const out = [];
    for (let i = 0; i < priceHistories.length; i += step) out.push(priceHistories[i]);
    return out;
  }, [priceHistories, selectedTimeFrame]);

  // Build MA lookups by date
  const maMap = useMemo(() => {
    const map = { '5d': new Map(), '40d': new Map(), '200d': new Map() };
    ['5d', '40d', '200d'].forEach(k => {
      (movingAverages[k] || []).forEach(item => map[k].set(item.date, item.movingAverage));
    });
    return map;
  }, [movingAverages]);

  // Set default window to show the most recent segment for that timeframe
  useEffect(() => {
    const len = series.length;
    if (!len) return;

    const desired = defaultWindowPoints(selectedTimeFrame);
    const size = desired === Number.POSITIVE_INFINITY ? len : Math.min(desired, len);
    const start = Math.max(0, len - size);

    setWindowSize(size);
    setWindowStart(start);
  }, [selectedTimeFrame, series]);

  if (!security) return <div>Loading...</div>;

  // FULL datasets (no slicing) so the line is continuous and "slides into view"
  const labels = series.map(h => h.date);

  const data = {
    labels,
    datasets: [
      {
        label: `Price (${securityLongName || 'Unknown'})`,
        data: series.map(h => h.price),
        borderColor: '#00796b',
        backgroundColor: 'rgba(0, 255, 179, 0.2)',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0.15,
      },
      selectedAverage === '5d' && {
        label: '5-Day MA',
        data: series.map(h => maMap['5d'].get(h.date) ?? null),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0.15,
      },
      selectedAverage === '40d' && {
        label: '40-Day MA',
        data: series.map(h => maMap['40d'].get(h.date) ?? null),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0.15,
      },
      selectedAverage === '200d' && {
        label: '200-Day MA',
        data: series.map(h => maMap['200d'].get(h.date) ?? null),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0.15,
      },
    ].filter(Boolean),
  };

  const len = series.length;
  const maxStart = Math.max(0, len - windowSize);

  // For category scale, min/max can be indices. This is the key to smooth “long chart sliding”.
  const xMin = selectedTimeFrame === 'quarterly' ? undefined : Math.min(windowStart, maxStart);
  const xMax = selectedTimeFrame === 'quarterly'
    ? undefined
    : Math.min(Math.max(0, xMin + windowSize - 1), len - 1);

  const visibleStartDate = xMin !== undefined ? labels[xMin] : labels[0];
  const visibleEndDate = xMax !== undefined ? labels[xMax] : labels[len - 1];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    animation: {
      duration: 220,
      easing: 'linear',
    },
    scales: {
      x: {
        type: 'category',
        min: xMin,          // <-- viewport start (index)
        max: xMax,          // <-- viewport end (index)
        title: { display: true, text: 'Date', color: '#00796b' },
        ticks: { color: '#00796b', maxTicksLimit: 10 },
        grid: { color: 'rgb(202, 202, 202)' },
      },
      y: {
        type: isLogScale ? 'logarithmic' : 'linear',
        title: { display: true, text: 'Price', color: '#00796b' },
        ticks: { color: '#00796b', beginAtZero: false },
        grid: { color: 'rgb(202, 202, 202)' },
      },
    },
    plugins: {
      legend: { labels: { color: '#00796b' } },
      zoom: {
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
        pan: { enabled: true, mode: 'x' },
      },
    },
  };

  const sliderEnabled = selectedTimeFrame !== 'quarterly' && len > windowSize;

  return (
    <div className='security-container'>
      <div className="sidebar">
        <h3>Time Period</h3>
        {['daily', 'weekly', 'monthly', 'quarterly'].map(time => (
          <button
            key={time}
            onClick={() => setSelectedTimeFrame(time)}
            className={selectedTimeFrame === time ? 'selected' : ''}
          >
            {time.charAt(0).toUpperCase() + time.slice(1)}
          </button>
        ))}

        <h3>Moving Averages</h3>
        {['5d', '40d', '200d'].map(avg => (
          <button
            key={avg}
            onClick={() => setSelectedAverage(avg === selectedAverage ? null : avg)}
            className={selectedAverage === avg ? 'selected' : ''}
          >
            {avg}
          </button>
        ))}

        <h3>Scale</h3>
        <div className="scale-buttons">
          <button
            onClick={() => setIsLogScale(false)}
            className={!isLogScale ? 'selected' : ''}
          >
            Linear
          </button>
          <button
            onClick={() => setIsLogScale(true)}
            className={isLogScale ? 'selected' : ''}
          >
            Logarithmic
          </button>
        </div>
      </div>

      <div className="main-content">
        <h2 className='security-hdr'>{securityLongName || "Unknown Security"}</h2>

        <div className="chart-wrapper">
          <div className="chart-canvas">
            <Line data={data} options={chartOptions} />
          </div>

          <div className="chart-scrollbar">
            <div className="chart-scrollbar-meta">
              <span>{visibleStartDate || '-'}</span>
              <span>{visibleEndDate || '-'}</span>
            </div>

            <input
              className="chart-scrollbar-range"
              type="range"
              min={0}
              max={maxStart}
              value={Math.min(windowStart, maxStart)}
              step={1}
              disabled={!sliderEnabled}
              onChange={(e) => setWindowStart(Number(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;