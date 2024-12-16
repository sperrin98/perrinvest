import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Currencies.css';

function Currencies() {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/currencies`)
      .then(response => response.json())
      .then(data => {
        console.log('Fetched data:', data);  // Log data to ensure it's coming through correctly
        setCurrencies(data);
        setLoading(false);
      })
      .catch(error => {
        setError(error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const filteredCurrencies = currencies.filter(currency =>
    currency.security_long_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRowClick = (id) => {
    navigate(`/currencies/${id}`);
  };

  // Function to format the price to two decimal places
  const formatPrice = (price) => {
    return price.toFixed(2);
  };

  // Function to determine the color based on the percentage change
  const getChangeColor = (percentChange) => {
    return percentChange < 0 ? 'red' : 'green';
  };

  return (
    <div className='currencies-container'>
      <div className='search-container'>
        <input
          type='text'
          placeholder='Search Currencies...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='search-input'
        />
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Currency</th>
            <th>Latest Price</th>
            <th>% Change</th>
          </tr>
        </thead>
        <tbody>
          {filteredCurrencies.map(currency => (
            <tr key={currency.security_id} onClick={() => handleRowClick(currency.security_id)}>
              <td>{currency.security_long_name}</td>
              <td>{formatPrice(currency.latest_price)}</td>
              <td className={getChangeColor(currency.percent_change)}>
                {currency.percent_change}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="back-button-container">
        <Link to="/" className="back-button">Go Back to Homepage</Link>
      </div>
    </div>
  );
}

export default Currencies;
