import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import annotationPlugin from 'chartjs-plugin-annotation';
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
  zoomPlugin,
  annotationPlugin
);

const RANGE_PRESETS = ['1Y', '3Y', '5Y', '10Y', 'MAX'];

const EVENT_MARKERS = [
  { id: 'nixon', label: '1971 Nixon Shock', date: '1971-08-15' },
  { id: 'blackmonday', label: '1987 Crash', date: '1987-10-19' },
  { id: 'dotcom', label: '2000 Dot-Com Peak', date: '2000-03-10' },
  { id: 'gfc', label: '2008 GFC', date: '2008-09-15' },
  { id: 'covid', label: '2020 Covid Crash', date: '2020-03-16' },
  { id: 'inflation', label: '2022 Inflation Shock', date: '2022-06-13' },
];

const MACRO_REGIMES = [
  { id: 'qe1', label: 'QE1', start: '2008-11-25', end: '2010-03-31', type: 'qe' },
  { id: 'qe2', label: 'QE2', start: '2010-11-03', end: '2011-06-30', type: 'qe' },
  { id: 'qe3', label: 'QE3', start: '2012-09-13', end: '2014-10-29', type: 'qe' },
  { id: 'qe_pandemic', label: 'Pandemic QE', start: '2020-03-15', end: '2022-03-15', type: 'qe' },
  { id: 'hike_1994', label: 'Rate Hike Cycle', start: '1994-02-04', end: '1995-02-01', type: 'hike' },
  { id: 'hike_1999', label: 'Rate Hike Cycle', start: '1999-06-30', end: '2000-05-16', type: 'hike' },
  { id: 'hike_2004', label: 'Rate Hike Cycle', start: '2004-06-30', end: '2006-08-08', type: 'hike' },
  { id: 'hike_2015', label: 'Rate Hike Cycle', start: '2015-12-16', end: '2018-12-19', type: 'hike' },
  { id: 'hike_2022', label: 'Rate Hike Cycle', start: '2022-03-16', end: '2023-07-26', type: 'hike' },
];

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

  const [selectedRangePreset, setSelectedRangePreset] = useState('MAX');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [activeStartDate, setActiveStartDate] = useState('');
  const [activeEndDate, setActiveEndDate] = useState('');

  const [showEventMarkers, setShowEventMarkers] = useState(false);
  const [showMacroRegimes, setShowMacroRegimes] = useState(false);

  const chartScrollRef = useRef(null);

  const extractMovingAverageValue = (item, key) => {
    const fallbackKeys = {
      '5d': ['5d_moving_average', 'moving_average_5d', 'five_day_moving_average', 'ma_5d', 'ma5d'],
      '40d': ['40d_moving_average', 'moving_average_40d', 'forty_day_moving_average', 'ma_40d', 'ma40d'],
      '200d': ['200d_moving_average', 'moving_average_200d', 'two_hundred_day_moving_average', 'ma_200d', 'ma200d']
    };

    for (const candidate of fallbackKeys[key]) {
      if (item[candidate] !== undefined && item[candidate] !== null && item[candidate] !== '') {
        const parsed = Number(item[candidate]);
        if (Number.isFinite(parsed)) return parsed;
      }
    }

    return null;
  };

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
        const formatted = response.data
          .map(history => ({
            date: new Date(history[1]).toISOString().split('T')[0],
            price: Number(history[2]),
          }))
          .filter(item => item.date && Number.isFinite(item.price));

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
        movingAveragesData['5d'] = response5d.data
          .map(item => ({
            date: new Date(item.price_date).toISOString().split('T')[0],
            movingAverage: extractMovingAverageValue(item, '5d'),
          }))
          .filter(item => item.date && Number.isFinite(item.movingAverage));

        const response40d = await axios.get(`${process.env.REACT_APP_API_URL}/securities/${id}/40d-moving-average`);
        movingAveragesData['40d'] = response40d.data
          .map(item => ({
            date: new Date(item.price_date).toISOString().split('T')[0],
            movingAverage: extractMovingAverageValue(item, '40d'),
          }))
          .filter(item => item.date && Number.isFinite(item.movingAverage));

        const response200d = await axios.get(`${process.env.REACT_APP_API_URL}/securities/${id}/200d-moving-average`);
        movingAveragesData['200d'] = response200d.data
          .map(item => ({
            date: new Date(item.price_date).toISOString().split('T')[0],
            movingAverage: extractMovingAverageValue(item, '200d'),
          }))
          .filter(item => item.date && Number.isFinite(item.movingAverage));

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

  useEffect(() => {
    if (!chartScrollRef.current) return;
    if (window.innerWidth > 768) return;
    chartScrollRef.current.scrollLeft = chartScrollRef.current.scrollWidth;
  }, [selectedTimeFrame, selectedAverage, activeStartDate, activeEndDate, showEventMarkers, showMacroRegimes, isLogScale, priceHistories.length]);

  const securityLongName = security?.[1];

  const resampleStep = (tf) => {
    switch (tf) {
      case 'daily': return 1;
      case 'weekly': return 5;
      case 'monthly': return 21;
      case 'quarterly': return 63;
      default: return 1;
    }
  };

  const shiftYears = (dateString, years) => {
    const date = new Date(dateString);
    const shifted = new Date(date);
    shifted.setFullYear(shifted.getFullYear() - years);
    return shifted.toISOString().split('T')[0];
  };

  const clampStartDate = (start, minDate, maxDate) => {
    if (!start) return minDate;
    if (start < minDate) return minDate;
    if (start > maxDate) return minDate;
    return start;
  };

  const getPresetStartDate = (preset, maxDate, minDate) => {
    if (!maxDate || !minDate) return '';
    if (preset === 'MAX') return minDate;

    const yearsMap = { '1Y': 1, '3Y': 3, '5Y': 5, '10Y': 10 };
    const years = yearsMap[preset];
    if (!years) return minDate;

    const shifted = shiftYears(maxDate, years);
    return clampStartDate(shifted, minDate, maxDate);
  };

  useEffect(() => {
    if (!priceHistories.length) return;

    const minDate = priceHistories[0].date;
    const maxDate = priceHistories[priceHistories.length - 1].date;

    setSelectedRangePreset('MAX');
    setActiveStartDate(minDate);
    setActiveEndDate(maxDate);
    setCustomStartDate(minDate);
    setCustomEndDate(maxDate);
  }, [priceHistories]);

  const maMap = useMemo(() => {
    const map = { '5d': new Map(), '40d': new Map(), '200d': new Map() };
    ['5d', '40d', '200d'].forEach(k => {
      (movingAverages[k] || []).forEach(item => map[k].set(item.date, item.movingAverage));
    });
    return map;
  }, [movingAverages]);

  const filteredFullHistory = useMemo(() => {
    if (!priceHistories.length || !activeStartDate || !activeEndDate) return [];
    return priceHistories.filter(item => item.date >= activeStartDate && item.date <= activeEndDate);
  }, [priceHistories, activeStartDate, activeEndDate]);

  const chartSeries = useMemo(() => {
    if (!filteredFullHistory.length) return [];
    const step = resampleStep(selectedTimeFrame);
    const out = [];

    for (let i = 0; i < filteredFullHistory.length; i += step) {
      out.push(filteredFullHistory[i]);
    }

    const lastPoint = filteredFullHistory[filteredFullHistory.length - 1];
    if (out.length && out[out.length - 1]?.date !== lastPoint?.date) {
      out.push(lastPoint);
    }

    return out;
  }, [filteredFullHistory, selectedTimeFrame]);

  const activeSeriesFull = useMemo(() => {
    if (!priceHistories.length) return [];

    return priceHistories
      .map(item => ({
        date: item.date,
        value: selectedAverage ? maMap[selectedAverage].get(item.date) ?? null : item.price,
      }))
      .filter(item => item.value !== null && Number.isFinite(item.value));
  }, [priceHistories, selectedAverage, maMap]);

  const activeSeriesFiltered = useMemo(() => {
    if (!activeSeriesFull.length || !activeStartDate || !activeEndDate) return [];
    return activeSeriesFull.filter(item => item.date >= activeStartDate && item.date <= activeEndDate);
  }, [activeSeriesFull, activeStartDate, activeEndDate]);

  const percentileRank = (values, currentValue) => {
    if (!values.length || !Number.isFinite(currentValue)) return null;
    const count = values.filter(v => v <= currentValue).length;
    return (count / values.length) * 100;
  };

  const mean = (values) => {
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  };

  const stdDev = (values) => {
    if (!values.length) return null;
    const avg = mean(values);
    const variance = values.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / values.length;
    return Math.sqrt(variance);
  };

  const sliceSinceYears = (series, years) => {
    if (!series.length) return [];
    const endDate = series[series.length - 1].date;
    const startDate = shiftYears(endDate, years);
    return series.filter(item => item.date >= startDate);
  };

  const stats = useMemo(() => {
    if (!activeSeriesFiltered.length || !activeSeriesFull.length) {
      return {
        currentValue: null,
        percentile1Y: null,
        percentile5Y: null,
        percentileFull: null,
        zScore: null,
      };
    }

    const currentValue = activeSeriesFiltered[activeSeriesFiltered.length - 1]?.value ?? null;
    const fullValues = activeSeriesFull.map(item => item.value);
    const values1Y = sliceSinceYears(activeSeriesFull, 1).map(item => item.value);
    const values5Y = sliceSinceYears(activeSeriesFull, 5).map(item => item.value);

    const longRunMean = mean(fullValues);
    const longRunStd = stdDev(fullValues);

    return {
      currentValue,
      percentile1Y: percentileRank(values1Y, currentValue),
      percentile5Y: percentileRank(values5Y, currentValue),
      percentileFull: percentileRank(fullValues, currentValue),
      zScore:
        longRunStd && Number.isFinite(longRunStd) && longRunStd !== 0
          ? (currentValue - longRunMean) / longRunStd
          : null,
    };
  }, [activeSeriesFiltered, activeSeriesFull]);

  const formatValue = (value) => {
    if (value === null || value === undefined || !Number.isFinite(value)) return '-';
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatPercentile = (value) => {
    if (value === null || value === undefined || !Number.isFinite(value)) return '-';
    return `${value.toFixed(1)}%`;
  };

  const formatZScore = (value) => {
    if (value === null || value === undefined || !Number.isFinite(value)) return '-';
    return value.toFixed(2);
  };

  const handlePresetRange = (preset) => {
    if (!priceHistories.length) return;

    const minDate = priceHistories[0].date;
    const maxDate = priceHistories[priceHistories.length - 1].date;
    const newStart = getPresetStartDate(preset, maxDate, minDate);

    setSelectedRangePreset(preset);
    setActiveStartDate(newStart);
    setActiveEndDate(maxDate);
    setCustomStartDate(newStart);
    setCustomEndDate(maxDate);
  };

  const handleApplyCustomRange = () => {
    if (!priceHistories.length) return;

    const minDate = priceHistories[0].date;
    const maxDate = priceHistories[priceHistories.length - 1].date;

    let start = customStartDate || minDate;
    let end = customEndDate || maxDate;

    if (start < minDate) start = minDate;
    if (end > maxDate) end = maxDate;

    if (start > end) {
      const temp = start;
      start = end;
      end = temp;
    }

    setSelectedRangePreset('');
    setActiveStartDate(start);
    setActiveEndDate(end);
    setCustomStartDate(start);
    setCustomEndDate(end);
  };

  const labels = chartSeries.map(h => h.date);

  const findNearestVisibleDate = (targetDate, visibleDates) => {
    if (!visibleDates.length) return null;

    const target = new Date(targetDate).getTime();
    let nearest = visibleDates[0];
    let minDiff = Math.abs(new Date(visibleDates[0]).getTime() - target);

    for (let i = 1; i < visibleDates.length; i += 1) {
      const diff = Math.abs(new Date(visibleDates[i]).getTime() - target);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = visibleDates[i];
      }
    }

    return nearest;
  };

  const findFirstVisibleOnOrAfter = (targetDate, visibleDates) => {
    const found = visibleDates.find(date => date >= targetDate);
    return found || null;
  };

  const findLastVisibleOnOrBefore = (targetDate, visibleDates) => {
    for (let i = visibleDates.length - 1; i >= 0; i -= 1) {
      if (visibleDates[i] <= targetDate) return visibleDates[i];
    }
    return null;
  };

  const buildAlignedMAData = (key) => {
    return chartSeries.map(point => {
      const exact = maMap[key].get(point.date);
      if (exact !== undefined && exact !== null && Number.isFinite(exact)) return exact;

      const fullHistoryMatch = movingAverages[key]?.find(item => item.date === point.date);
      if (fullHistoryMatch && Number.isFinite(fullHistoryMatch.movingAverage)) {
        return fullHistoryMatch.movingAverage;
      }

      return null;
    });
  };

  const annotations = useMemo(() => {
    const annotationConfig = {};
    if (!labels.length) return annotationConfig;

    const visibleStart = labels[0];
    const visibleEnd = labels[labels.length - 1];

    if (showMacroRegimes) {
      MACRO_REGIMES.forEach((regime) => {
        const overlapsRange = regime.end >= visibleStart && regime.start <= visibleEnd;
        if (!overlapsRange) return;

        const xMin = findFirstVisibleOnOrAfter(regime.start, labels) || visibleStart;
        const xMax = findLastVisibleOnOrBefore(regime.end, labels) || visibleEnd;

        if (!xMin || !xMax || xMin > xMax) return;

        const isQE = regime.type === 'qe';

        annotationConfig[`box_${regime.id}`] = {
          type: 'box',
          xMin,
          xMax,
          backgroundColor: isQE ? 'rgba(0, 121, 107, 0.10)' : 'rgba(255, 159, 64, 0.12)',
          borderColor: isQE ? 'rgba(0, 121, 107, 0.35)' : 'rgba(255, 159, 64, 0.4)',
          borderWidth: 1,
          label: {
            display: true,
            content: regime.label,
            position: 'start',
            color: isQE ? '#00796b' : '#d97706',
            backgroundColor: 'rgba(255,255,255,0.85)',
            padding: 4,
            font: { size: 10, weight: '600' }
          }
        };
      });
    }

    if (showEventMarkers) {
      EVENT_MARKERS.forEach((event) => {
        if (event.date < visibleStart || event.date > visibleEnd) return;

        const snappedDate = findNearestVisibleDate(event.date, labels);
        if (!snappedDate) return;

        annotationConfig[`line_${event.id}`] = {
          type: 'line',
          xMin: snappedDate,
          xMax: snappedDate,
          borderColor: '#c62828',
          borderWidth: 1.5,
          borderDash: [6, 4],
          label: {
            display: true,
            content: event.label,
            rotation: -90,
            position: 'start',
            yAdjust: -10,
            backgroundColor: 'rgba(198, 40, 40, 0.90)',
            color: '#ffffff',
            font: { size: 10, weight: '600' },
            padding: 4
          }
        };
      });
    }

    return annotationConfig;
  }, [showEventMarkers, showMacroRegimes, labels]);

  if (!security) return <div>Loading...</div>;

  const data = {
    labels,
    datasets: [
      {
        label: `Price (${securityLongName || 'Unknown'})`,
        data: chartSeries.map(h => h.price),
        borderColor: '#00796b',
        backgroundColor: 'rgba(0, 255, 179, 0.2)',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0.15,
        spanGaps: true,
      },
      selectedAverage === '5d' && {
        label: '5-Day MA',
        data: buildAlignedMAData('5d'),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0.15,
        spanGaps: true,
      },
      selectedAverage === '40d' && {
        label: '40-Day MA',
        data: buildAlignedMAData('40d'),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0.15,
        spanGaps: true,
      },
      selectedAverage === '200d' && {
        label: '200-Day MA',
        data: buildAlignedMAData('200d'),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0.15,
        spanGaps: true,
      },
    ].filter(Boolean),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 220,
      easing: 'linear',
    },
    scales: {
      x: {
        type: 'category',
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
      annotation: {
        clip: false,
        annotations,
      },
      zoom: {
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
        pan: { enabled: true, mode: 'x' },
      },
    },
  };

  const statsTitle = selectedAverage
    ? `${selectedAverage.toUpperCase()} Moving Average`
    : 'Price';

  return (
    <div className='security-container'>
      <div className="sidebar">
        <div className="desktop-sidebar-controls">
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

          <h3>Overlays</h3>
          <div className="overlay-toggle-group">
            <button
              onClick={() => setShowEventMarkers(prev => !prev)}
              className={showEventMarkers ? 'selected' : ''}
            >
              Event Markers
            </button>
            <button
              onClick={() => setShowMacroRegimes(prev => !prev)}
              className={showMacroRegimes ? 'selected' : ''}
            >
              QE / Rate Cycles
            </button>
          </div>

          <div className="overlay-note">
            Toggle historical shocks and macro regimes on the chart.
          </div>
        </div>

        <div className="mobile-control-panel">
          <div className="mobile-control-section">
            <div className="mobile-control-title">Time Period</div>
            <div className="mobile-chip-row mobile-chip-row-compact mobile-chip-grid mobile-chip-grid-4">
              {['daily', 'weekly', 'monthly', 'quarterly'].map(time => (
                <button
                  key={time}
                  onClick={() => setSelectedTimeFrame(time)}
                  className={`mobile-chip ${selectedTimeFrame === time ? 'selected' : ''}`}
                >
                  {time.charAt(0).toUpperCase() + time.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="mobile-control-section">
            <div className="mobile-control-title">Moving Averages</div>
            <div className="mobile-chip-row mobile-chip-row-compact mobile-chip-grid mobile-chip-grid-3">
              {['5d', '40d', '200d'].map(avg => (
                <button
                  key={avg}
                  onClick={() => setSelectedAverage(avg === selectedAverage ? null : avg)}
                  className={`mobile-chip ${selectedAverage === avg ? 'selected' : ''}`}
                >
                  {avg}
                </button>
              ))}
            </div>
          </div>

          <div className="mobile-control-section">
            <div className="mobile-control-title">Scale</div>
            <div className="mobile-chip-row mobile-chip-grid mobile-chip-grid-2">
              <button
                onClick={() => setIsLogScale(false)}
                className={`mobile-chip ${!isLogScale ? 'selected' : ''}`}
              >
                Linear
              </button>
              <button
                onClick={() => setIsLogScale(true)}
                className={`mobile-chip ${isLogScale ? 'selected' : ''}`}
              >
                Log
              </button>
            </div>
          </div>

          <div className="mobile-control-section">
            <div className="mobile-control-title">Overlays</div>
            <div className="mobile-chip-row mobile-chip-grid mobile-chip-grid-2">
              <button
                onClick={() => setShowEventMarkers(prev => !prev)}
                className={`mobile-chip ${showEventMarkers ? 'selected' : ''}`}
              >
                Event Markers
              </button>
              <button
                onClick={() => setShowMacroRegimes(prev => !prev)}
                className={`mobile-chip ${showMacroRegimes ? 'selected' : ''}`}
              >
                QE / Rate Cycles
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <h2 className='security-hdr'>{securityLongName || 'Unknown Security'}</h2>

        <div className="chart-toolbar">
          <div className="range-presets">
            {RANGE_PRESETS.map(range => (
              <button
                key={range}
                className={`range-btn ${selectedRangePreset === range ? 'selected' : ''}`}
                onClick={() => handlePresetRange(range)}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="custom-date-controls">
            <div className="date-input-group">
              <label htmlFor="start-date">Start</label>
              <input
                id="start-date"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>

            <div className="date-input-group">
              <label htmlFor="end-date">End</label>
              <input
                id="end-date"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>

            <button className="apply-range-btn" onClick={handleApplyCustomRange}>
              Apply
            </button>
          </div>
        </div>

        <div className="mobile-top-range-bar">
          <div className="mobile-range-presets">
            {RANGE_PRESETS.map(range => (
              <button
                key={range}
                className={`mobile-range-btn ${selectedRangePreset === range ? 'selected' : ''}`}
                onClick={() => handlePresetRange(range)}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="mobile-range-dates">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
            />
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
            />
            <button onClick={handleApplyCustomRange}>Apply</button>
          </div>
        </div>

        <div className="chart-wrapper">
          <div className="chart-main-row">
            <div className="chart-scroll-shell">
              <div className="chart-scroll-hint">Swipe sideways to view the full chart</div>
              <div className="chart-scroll-area" ref={chartScrollRef}>
                <div className="chart-section">
                  <div className="chart-canvas">
                    <Line data={data} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>

            <div className="stats-panel">
              <div className="stats-panel-header">
                <h3>{statsTitle} Stats</h3>
                <span>{activeStartDate && activeEndDate ? `${activeStartDate} to ${activeEndDate}` : '-'}</span>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">Current Value</span>
                  <span className="stat-value">{formatValue(stats.currentValue)}</span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">1Y Percentile</span>
                  <span className="stat-value">{formatPercentile(stats.percentile1Y)}</span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">5Y Percentile</span>
                  <span className="stat-value">{formatPercentile(stats.percentile5Y)}</span>
                </div>

                <div className="stat-card">
                  <span className="stat-label">Full-History Percentile</span>
                  <span className="stat-value">{formatPercentile(stats.percentileFull)}</span>
                </div>

                <div className="stat-card stat-card-wide">
                  <span className="stat-label">Z-Score vs Long-Run Mean</span>
                  <span className="stat-value">{formatZScore(stats.zScore)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-range-summary">
            <span>{activeStartDate || '-'}</span>
            <span>{activeEndDate || '-'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;