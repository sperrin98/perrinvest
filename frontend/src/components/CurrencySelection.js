import React, { useState, useEffect } from 'react';
import './Currencies.css';

function CurrencySelection() {
  const [currencies, setCurrencies] = useState([]);
  const [currency1, setCurrency1] = useState('');
  const [currency2, setCurrency2] = useState('');
  const [dividedCurrency, setDividedCurrency] = useState(null);

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
          const formattedData = data.map(record => ({
            ...record,
            price_date: new Date(record.price_date).toLocaleDateString('en-CA') // Format date as YYYY/MM/DD
          }));
          setDividedCurrency(formattedData);
        })
        .catch(error => console.error('Error dividing currencies:', error));
    } else {
      console.error('Currency IDs are missing');
    }
  };

  return (
    <div className='divided-currency-container'>
      <h2>Divide Currencies</h2>
      <div>
        <label>Currency 1:</label>
        <select value={currency1} onChange={e => setCurrency1(e.target.value)}>
          <option value="">Select Currency</option>
          {currencies.map(currency => (
            <option key={currency.id} value={currency.security_long_name}>
              {currency.security_long_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Currency 2:</label>
        <select value={currency2} onChange={e => setCurrency2(e.target.value)}>
          <option value="">Select Currency</option>
          {currencies.map(currency => (
            <option key={currency.id} value={currency.security_long_name}>
              {currency.security_long_name}
            </option>
          ))}
        </select>
      </div>
      <button onClick={handleCurrencyDivision}>Divide</button>
      {dividedCurrency && (
        <div>
          <h3>Divided Currency Result</h3>
          <ul>
            {dividedCurrency.map((record, index) => (
              <li key={index}>
                {record.price_date}: {record.divided_price}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CurrencySelection;
