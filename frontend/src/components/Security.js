import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function Security() {
  const { id } = useParams(); // Get the security ID from the URL
  const [security, setSecurity] = useState(null);
  const [priceHistories, setPriceHistories] = useState([]);

  useEffect(() => {
    axios.get(`http://localhost:5000/securities/${id}`)
      .then(response => {
        setSecurity(response.data.security);
        console.log('Security data:', response.data.security);  // Log security data for debugging
      })
      .catch(error => {
        console.error('Error fetching security:', error);
      });
      
    axios.get(`http://localhost:5000/securities/${id}/price-histories`)
      .then(response => {
        // Log entire response for debugging
        console.log('Price histories response:', response.data);

        // Ensure the data is an array and map over it
        if (Array.isArray(response.data)) {
          const formattedPriceHistories = response.data.map(history => {
            console.log('Raw history:', history);  // Log each history item
            const date = new Date(history[1]);
            if (isNaN(date)) {
              console.error('Invalid date:', history[1]);  // Log invalid dates
              return { date: history[1], price: history[2] };
            }

            const formattedDate = date.toISOString().split('T')[0]; // Format to yyyy-mm-dd
            return { date: formattedDate, price: history[2] };
          });
          setPriceHistories(formattedPriceHistories);
        } else {
          console.error('Unexpected response format:', response.data);
        }
      })
      .catch(error => {
        console.error('Error fetching price histories:', error);
      });
  }, [id]);

  if (!security) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{security.security_long_name}</h1>
      <p>Security ID: {security.security_id}</p>
      <p>Short Name: {security.security_short_name}</p>

      <h2>Price history for {security.security_long_name}</h2>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {priceHistories.map((history, index) => (
            <tr key={index}>
              <td>{history.date}</td>
              <td>{history.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Security;
