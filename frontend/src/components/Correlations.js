import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2'; // Import the Line chart component
import './Correlations.css';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const Correlations = () => {
  // State variables
  const [secId1, setSecId1] = useState(1);  // Security 1
  const [secId2, setSecId2] = useState(2);  // Security 2
  const [period, setPeriod] = useState(90);  // Number of Periods
  const [timeframeType, setTimeframeType] = useState('yearly');  // Timeframe Type
  const [endDate, setEndDate] = useState('2023-01-01');  // End Date
  const [correlations, setCorrelations] = useState([]);  
  const [loading, setLoading] = useState(false);  
  const [error, setError] = useState(null);  
  const [securities, setSecurities] = useState([]);  

  // Fetch securities when the component mounts
  useEffect(() => {
    const fetchSecurities = async () => {
      try {
        const response = await fetch('http://localhost:5000/securities'); 
        if (!response.ok) {
          throw new Error('Failed to fetch securities');
        }
        const data = await response.json();
        setSecurities(data);
      } catch (error) {
        console.error('Error fetching securities:', error);
        setError(error.message);
      }
    };

    fetchSecurities();
  }, []);

  // Function to fetch correlations based on input parameters
  const fetchCorrelations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:5000/correlations?sec_id=${secId1}&sec_id2=${secId2}&period=${period}&timeframe_type=${timeframeType}&end_date=${endDate}`
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

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();  
    fetchCorrelations();  
  };

  // Prepare data for the chart
  const chartData = {
    labels: correlations.map(correlation => {
      // Convert the date to YYYY/MM/DD format for window_start_date
      const date = new Date(correlation.window_start_date);
      return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    }).reverse(), // Reverse the order of labels for X-axis
    datasets: [
      {
        label: 'Correlation Value',
        data: correlations.map(correlation => correlation.correlation_value).reverse(), // Reverse the order of data for Y-axis
        fill: false, // No fill under the line
        borderColor: 'rgba(75, 192, 192, 1)', // Line color
        tension: 0.1, // Line smoothness
      },
    ],
  };

  return (
    <div className="correlation-container" style={{ marginTop: '200px' }}>
      <h2>Calculate Correlation</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="end-date">End Date:</label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="period">Period (Number of Periods):</label>
          <input
            type="number"
            id="period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            required
          />
        </div>

        <div>
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

        <div>
          <label htmlFor="sec-id-1">Select Security 1:</label>
          <select id="sec-id-1" value={secId1} onChange={(e) => setSecId1(e.target.value)} required>
            {securities.length > 0 ? (
              securities.map((security) => (
                <option key={security.security_id} value={security.security_id}>
                  {security.security_long_name} ({security.ticker_symbol})
                </option>
              ))
            ) : (
              <option value="">Loading securities...</option>
            )}
          </select>
        </div>

        <div>
          <label htmlFor="sec-id-2">Select Security 2:</label>
          <select id="sec-id-2" value={secId2} onChange={(e) => setSecId2(e.target.value)} required>
            {securities.length > 0 ? (
              securities.map((security) => (
                <option key={security.security_id} value={security.security_id}>
                  {security.security_long_name} ({security.ticker_symbol})
                </option>
              ))
            ) : (
              <option value="">Loading securities...</option>
            )}
          </select>
        </div>

        <button type="submit">Calculate Correlation</button>
      </form>

      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}

      {correlations.length > 0 && (
        <>
          <Line data={chartData} options={{
            responsive: true,
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Date',
                },
                grid: {
                  borderColor: 'black', // Color of the X axis
                  borderWidth: 2, // Width of the X axis
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Correlation Value',
                },
                min: -1, // Minimum value for the Y axis
                max: 1,  // Maximum value for the Y axis
                ticks: {
                  stepSize: 0.2, // Y-axis increments
                  callback: (value) => {
                    // Center 0 and make labels for -1, 0, 1
                    if (value === 0) return '0';
                    if (value === 1) return '1';
                    if (value === -1) return '-1';
                    return value; // Return the value by default
                  },
                },
                grid: {
                  color: (context) => {
                    const { tick } = context;
                    return tick.value === 0 ? 'red' : 'black'; // Set color for the 0 grid line
                  },
                  borderColor: 'black', // Color of the Y axis
                  borderWidth: 2, // Width of the Y axis
                },
              },
            },
          }} />
          
          <table>
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
                  <td>
                    {`${new Date(correlation.window_start_date).getFullYear()}/${String(new Date(correlation.window_start_date).getMonth() + 1).padStart(2, '0')}/${String(new Date(correlation.window_start_date).getDate()).padStart(2, '0')}`}
                  </td>
                  <td>
                    {`${new Date(correlation.window_end_date).getFullYear()}/${String(new Date(correlation.window_end_date).getMonth() + 1).padStart(2, '0')}/${String(new Date(correlation.window_end_date).getDate()).padStart(2, '0')}`}
                  </td>
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
