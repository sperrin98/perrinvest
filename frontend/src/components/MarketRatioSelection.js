import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import './MarketRatioSelection.css';

function MarketRatioSelection() {
  const [securities, setSecurities] = useState([]);
  const [selectedSecurity1, setSelectedSecurity1] = useState('');
  const [selectedSecurity2, setSelectedSecurity2] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [abbrev1, setAbbrev1] = useState('');
  const [abbrev2, setAbbrev2] = useState('');

  useEffect(() => {
    async function fetchSecurities() {
      try {
        const response = await fetch('http://localhost:5000/securities');
        const data = await response.json();
        if (Array.isArray(data)) {
          setSecurities(data);
        } else {
          console.error('Unexpected data format:', data);
        }
      } catch (err) {
        console.error('Error fetching securities:', err);
        setError('Failed to load securities.');
      }
    }
    fetchSecurities();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (selectedSecurity1 === selectedSecurity2) {
      setError('Please select two different securities.');
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/market-ratios/divide?security_long_name1=${selectedSecurity1}&security_long_name2=${selectedSecurity2}`);
      const data = await response.json();
      if (response.ok) {
        setResult(data.divided_prices);
        setAbbrev1(data.abbrev1);
        setAbbrev2(data.abbrev2);
        setError(null);
      } else {
        throw new Error(data.error || 'Error dividing market ratios');
      }
    } catch (err) {
      console.error('Error dividing market ratios:', err);
      setError('An error occurred while dividing market ratios.');
      setResult(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'yyyy/MM/dd');
  };

  const getChartData = () => {
    if (!result) return {};

    const labels = result.map(item => formatDate(item.price_date));
    const data = result.map(item => item.divided_price);

    return {
      labels: labels,
      datasets: [
        {
          label: `${selectedSecurity1} / ${selectedSecurity2}`,
          data: data,
          fill: false,
          borderColor: 'rgb(0, 255, 179)',
          backgroundColor: 'rgb(0, 255, 179)',
          borderWidth: 1,   // Thinner line
          pointRadius: 0.5, // Smaller points
        },
      ],
    };
  };

  const chartOptions = {
    plugins: {
      legend: {
        display: true,
        labels: {
          color: 'rgb(0, 255, 179)',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 255, 179, 0.8)',
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'rgb(0, 255, 179)',
        },
        grid: {
          color: 'rgb(68, 68, 68)',
        },
      },
      y: {
        ticks: {
          color: 'rgb(0, 255, 179)',
        },
        grid: {
          color: 'rgb(68, 68, 68)',
        },
        title: {
          display: true,
          text: 'Value',
          color: 'rgb(0, 255, 179)',
        },
      },
    },
  };

  return (
    <div className='divided-security-container'>
      <h2 className='market-ratio-title'>Divide Market Ratios</h2>
      <form onSubmit={handleSubmit}>
        <div className='security1'>
          <label className='security-label1'>
            Security 1:
            <select
              value={selectedSecurity1}
              onChange={e => setSelectedSecurity1(e.target.value)}
              required
            >
              <option value="">Select a security</option>
              {securities.map(security => (
                <option key={security.security_id} value={security.security_long_name}>
                  {security.security_long_name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className='security2'>
          <label className='security-label2'>
            Security 2:
            <select
              value={selectedSecurity2}
              onChange={e => setSelectedSecurity2(e.target.value)}
              required
            >
              <option value="">Select a security</option>
              {securities.map(security => (
                <option key={security.security_id} value={security.security_long_name}>
                  {security.security_long_name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className='divide-btn' type='submit'>Divide</button>
      </form>
      {error && <div className='error'>{error}</div>}
      {result && (
        <div>
          <h3 className='result-title'>Results ({selectedSecurity1} / {selectedSecurity2})</h3>
          <Line data={getChartData()} options={chartOptions} />
        </div>
      )}
    </div>
  );
}

export default MarketRatioSelection;
