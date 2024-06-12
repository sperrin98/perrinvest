import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

function MarketRatio() {
  const { id } = useParams(); // Get the market ratio ID from the URL
  const [marketRatio, setMarketRatio] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/market-ratios/${id}`)
      .then(response => {
        // Format date in market ratio data
        const formattedMarketRatio = response.data.market_ratio.map(item => {
          const date = new Date(item[0]);
          const formattedDate = date.toLocaleDateString('en-GB'); // Format to yyyy-mm-dd
          return { date: formattedDate, value: item[1] };
        });
        setMarketRatio({
          ratio_name: response.data.ratio_name,
          market_ratio: formattedMarketRatio
        });
      })
      .catch(error => {
        console.error('Error fetching market ratio:', error);
      });
  }, [id]);

  if (!marketRatio) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{marketRatio.ratio_name}</h1>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {marketRatio.market_ratio.map((item, index) => (
            <tr key={index}>
              <td>{item.date}</td>
              <td>{item.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MarketRatio;