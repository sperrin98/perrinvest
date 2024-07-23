const fetchGoldHistory = async () => {
    try {
      const response = await fetch('/api/gold-history');
      console.log('Response:', response);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      console.log('Result:', result);
      setData(result);
    } catch (error) {
      setError(error.message);
    }
  };