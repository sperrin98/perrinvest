import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import './Currencies.css';
import './CurrencySelection.css';

function CurrencySelection() {
  const [currencies, setCurrencies] = useState([]);
  const [currency1, setCurrency1] = useState('');
  const [currency2, setCurrency2] = useState('');
  const [dividedCurrency, setDividedCurrency] = useState(null);
  const [abbrev1, setAbbrev1] = useState('');
  const [abbrev2, setAbbrev2] = useState('');

  useEffect(() => {
    // Fetch currencies when the component mounts
    fetch('http://localhost:5000/currencies')
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCurrencies(data);
        } else {
          console.error('Unexpected data format:', data);
        }
      })
      .catch(error => console.error('Error fetching currencies:', error));
  }, []);

  const handleCurrencyDivision = () => {
    console.log('Currency 1:', currency1);
    console.log('Currency 2:', currency2);
    if (currency1 && currency2) {
      fetch(`http://localhost:5000/currencies/divide?security_long_name1=${currency1}&security_long_name2=${currency2}`)
        .then(response => response.json())
        .then(data => {
          console.log('Divided currency result:', data);
          setDividedCurrency(data.divided_prices);
          setAbbrev1(data.abbrev1);
          setAbbrev2(data.abbrev2);
        })
        .catch(error => console.error('Error dividing currencies:', error));
    } else {
      console.error('Currency IDs are missing');
    }
  };

  const getChartData = () => {
    if (!dividedCurrency) return {};

    const labels = dividedCurrency.map(item => item.price_date);
    const data = dividedCurrency.map(item => item.divided_price);

    return {
      labels: labels,
      datasets: [
        {
          label: `${abbrev1} / ${abbrev2}`,
          data: data,
          fill: false,
          borderColor: 'rgb(0, 255, 179)',
          backgroundColor: 'rgb(0, 255, 179)',
        },
      ],
    };
  };

  const chartOptions = {
    plugins: {
      legend: {
        display: true,
        labels: {
          color: 'rgb(0, 255, 179)'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 255, 179, 0.8)'
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'rgb(0, 255, 179)',
        },
        grid: {
          color: 'rgb(68, 68, 68)',
        }
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
        }
      }
    }
  };

  return (
    <div className='divided-currency-container'>
      <h2 className='divided-title'>Divide Currencies</h2>
      <div className='currency1'>
        <label className='currency-label1'>Currency 1:</label>
        <select value={currency1} onChange={e => setCurrency1(e.target.value)}>
          <option value="">Select Currency</option>
          {currencies.map(currency => (
            <option key={currency.id} value={currency.security_long_name}>
              {currency.security_long_name}
            </option>
          ))}
        </select>
      </div>
      <div className='currency2'>
        <label className='currency-label2'>Currency 2:</label>
        <select value={currency2} onChange={e => setCurrency2(e.target.value)}>
          <option value="">Select Currency</option>
          {currencies.map(currency => (
            <option key={currency.id} value={currency.security_long_name}>
              {currency.security_long_name}
            </option>
          ))}
        </select>
      </div>
      <button className='divide-btn' onClick={handleCurrencyDivision}>Divide</button>
      {dividedCurrency && (
        <div>
          <h3 className='divided-result-title'>Divided Currency Result ({abbrev1} / {abbrev2})</h3>
          <Line data={getChartData()} options={chartOptions} />
        </div>
      )}
    </div>
  );
}

export default CurrencySelection;
