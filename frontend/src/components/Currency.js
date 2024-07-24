// components/Currency.js

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './Currencies.css';

function Currency() {
  const { id } = useParams();
  const [currency, setCurrency] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const response = await fetch(`http://localhost:5000/securities/${id}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Fetched currency:', data); // Debugging line
        setCurrency(data);
      } catch (error) {
        console.error('Error fetching currency:', error); // Debugging line
        setError(error);
      }
    };

    const fetchPriceHistory = async () => {
      try {
        const response = await fetch(`http://localhost:5000/currencies/${id}/prices`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Fetched price history:', data); // Debugging line
        setPriceHistory(data);
      } catch (error) {
        console.error('Error fetching price history:', error); // Debugging line
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrency();
    fetchPriceHistory();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="currency-container">
      <h1>{currency ? currency.security_long_name : 'Currency details not available'}</h1>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {priceHistory.length > 0 ? (
            priceHistory.map((record, index) => (
              <tr key={`${record.price_date}-${index}`}>
                <td>{record.price_date}</td>
                <td>{record.price}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2">No price history available.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Currency;
