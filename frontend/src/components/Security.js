import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Security = () => {
  const { id } = useParams();
  const [security, setSecurity] = useState(null);
  const [priceHistories, setPriceHistories] = useState([]);

  useEffect(() => {
    const fetchSecurity = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/securities/${id}`);
        setSecurity(response.data.security);
      } catch (error) {
        console.error('Error fetching security:', error);
      }
    };

    const fetchPriceHistories = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/securities/${id}/price-histories`);
        const formattedPriceHistories = response.data.map(history => ({
          date: new Date(history[1]).toISOString().split('T')[0],
          price: history[2],
        }));
        setPriceHistories(formattedPriceHistories);
      } catch (error) {
        console.error('Error fetching price histories:', error);
      }
    };

    fetchSecurity();
    fetchPriceHistories();
  }, [id]);

  if (!security) {
    return <div>Loading...</div>;
  }

  const data = {
    labels: priceHistories.map(history => history.date),
    datasets: [{
      label: `Price History for ${security[1]}`,
      data: priceHistories.map(history => history.price),
      borderColor: ' rgb(0, 255, 179)',
      backgroundColor: ' rgb(0, 255, 179)',
      fill: false,
    }],
  };

  return (
    <div>
      <h1 className='security-header'>Price history for {security[1]}</h1>
      <Line data={data} options={{ responsive: true }} />
    </div>
  );
};

export default Security;
