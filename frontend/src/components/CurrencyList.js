import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function CurrencyList() {
  const [currencies, setCurrencies] = useState([]);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/currencies`)
      .then(response => response.json())
      .then(data => setCurrencies(data))
      .catch(error => console.error('Error fetching currencies:', error));
  }, []);

  return (
    <div>
      <h1>Currencies</h1>
      <ul>
        {currencies.map(currency => (
          <li key={currency.id}>
            <Link to={`/currencies/${currency.id}`}>{currency.security_long_name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CurrencyList;

