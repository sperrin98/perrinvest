import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import './Correlations.css';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const Correlations = () => {
  const [secId1, setSecId1] = useState(1);
  const [secId2, setSecId2] = useState(2);
  const [period, setPeriod] = useState(30);
  const [timeframeType, setTimeframeType] = useState('yearly');
  const [endDate, setEndDate] = useState('2024-01-01');
  const [correlations, setCorrelations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [securities, setSecurities] = useState([]);

  useEffect(() => {
    const fetchSecurities = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/securities`);
        if (!response.ok) throw new Error('Failed to fetch securities');
        const data = await response.json();
        setSecurities(data);
      } catch (error) {
        console.error('Error fetching securities:', error);
        setError(error.message);
      }
    };
    fetchSecurities();
  }, []);

  const fetchCorrelations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/correlations?sec_id=${secId1}&sec_id2=${secId2}&period=${period}&timeframe_type=${timeframeType}&end_date=${endDate}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response Error:', errorText);
        throw new Error(`Failed to fetch data: ${errorText}`);
      }

      const data = await response.json();
      setCorrelations(data);
    } catch (error) {
      console.error('Error fetching correlations:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchCorrelations();
  };

  const chartData = {
    labels: correlations.map(correlation => {
      const date = new Date(correlation.window_start_date);
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    }).reverse(),
    datasets: [
      {
        label: 'Correlation Value',
        data: correlations.map(correlation => correlation.correlation_value).reverse(),
        fill: false,
        borderColor: 'rgb(0, 255, 179)',
        pointBackgroundColor: 'rgb(0, 255, 179)',
        tension: 0.2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Correlation Value',
        },
        min: -1,
        max: 1,
        ticks: {
          stepSize: 0.2,
        },
      },
    },
  };

  return (
    <div className="correlation-container">
      <h2 className="correlation-title">Calculate Correlation</h2>
      <form className="correlation-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="end-date">End Date:</label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="period">Period (Number of D/W/M/Q/Ys):</label>
          <input
            type="number"
            id="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="timeframe-type">Timeframe Type:</label>
          <select
            id="timeframe-type"
            value={timeframeType}
            onChange={(e) => setTimeframeType(e.target.value)}
            required
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="sec-id-1">Select Security 1:</label>
          <select id="sec-id-1" value={secId1} onChange={(e) => setSecId1(e.target.value)} required>
            {securities.map((security) => (
              <option key={security.security_id} value={security.security_id}>
                {security.security_long_name} ({security.ticker_symbol})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="sec-id-2">Select Security 2:</label>
          <select id="sec-id-2" value={secId2} onChange={(e) => setSecId2(e.target.value)} required>
            {securities.map((security) => (
              <option key={security.security_id} value={security.security_id}>
                {security.security_long_name} ({security.ticker_symbol})
              </option>
            ))}
          </select>
        </div>
        <button className="correlation-button" type="submit">Calculate Correlation</button>
      </form>
      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error">Error: {error}</div>}
      {correlations.length > 0 && (
        <>
          <Line data={chartData} options={chartOptions} />
          <table className="correlation-table">
            <thead>
              <tr>
                <th>Window Start Date</th>
                <th>Window End Date</th>
                <th>Correlation Value</th>
              </tr>
            </thead>
            <tbody>
              {correlations.map((correlation, index) => (
                <tr key={index}>
                  <td>{new Date(correlation.window_start_date).toISOString().split('T')[0]}</td>
                  <td>{new Date(correlation.window_end_date).toISOString().split('T')[0]}</td>
                  <td>{correlation.correlation_value.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default Correlations;
