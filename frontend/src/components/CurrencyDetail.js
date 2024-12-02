import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Chart from 'chart.js/auto';

function CurrencyDetail() {
  const { id } = useParams();
  const [currency, setCurrency] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [chart, setChart] = useState(null);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/currencies/${id}`)
      .then(response => response.json())
      .then(data => {
        setCurrency(data.currency);
        setPriceHistory(data.price_history);
      })
      .catch(error => console.error('Error fetching currency details:', error));
  }, [id]);

  useEffect(() => {
    if (priceHistory.length > 0) {
      const ctx = document.getElementById('priceChart');
      if (chart) {
        chart.destroy();
      }
      const newChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: priceHistory.map(record => record.price_date),
          datasets: [{
            label: currency?.security_long_name,
            data: priceHistory.map(record => record.price),
            borderColor: 'rgb(0, 255, 179)',
            backgroundColor: 'rgba(0, 255, 179, 0.2)',
          }],
        },
        options: {
          responsive: true,
        },
      });
      setChart(newChart);
    }
  }, [priceHistory, currency]);

  if (!currency) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{currency.security_long_name}</h1>
      <canvas id="priceChart"></canvas>
    </div>
  );
}

export default CurrencyDetail;
