import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './Currencies.css';

function Currency() {
  const { id } = useParams();
  const [currency, setCurrency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/currencies/${id}`)
      .then(response => response.json())
      .then(data => {
        setCurrency(data);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className='currency-container'>
      <h1>{currency.security_name}</h1>
      <p>Symbol: {currency.symbol}</p>
      <p>Exchange Rate: {currency.exchange_rate}</p>
    </div>
  );
}

export default Currency;
