import { useState, useEffect } from 'react';

const fetchGoldHistory = async () => {
  try {
    const response = await fetch('/api/gold-history');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching gold history:', error);
    return [];
  }
};

const GoldHistory = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGoldHistory()
      .then(setData)
      .catch(error => setError(error.message));
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Gold Price History</h2>
      {/* Render your data here, for example in a chart or table */}
    </div>
  );
};

export default GoldHistory;
