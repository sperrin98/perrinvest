import React, { useEffect, useState } from 'react';

const AnnualReturns = () => {
  const [annualReturns, setAnnualReturns] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnnualReturns = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/annualreturns`);
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }
        const data = await response.json();
        setAnnualReturns(data); // Store the fetched data
      } catch (error) {
        setError(error.message); // Handle any errors
      }
    };

    fetchAnnualReturns(); // Fetch the annual returns when the component is mounted
  }, []);

  return (
    <div className="annual-returns-container">
      <h1>Annual Returns</h1>

      {/* Show error message if data fetch fails */}
      {error && <div>{`Error: ${error}`}</div>}

      {/* Render the table with the fetched annual returns data */}
      {annualReturns.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Gold</th>
              <th>Oil</th>
              <th>Platinum</th>
              <th>Silver</th>
              <th>Palladium</th>
              <th>Copper</th>
              <th>Sugar</th>
              <th>Cocoa</th>
              <th>Wheat</th>
              <th>Coffee</th>
              <th>Soybean Oil</th>
              <th>Corn</th>
              <th>Natural Gas</th>
              <th>Soybean</th>
              <th>Soybean Meal</th>
            </tr>
          </thead>
          <tbody>
            {annualReturns.map((row) => (
              <tr key={row.year}>
                <td>{row.year}</td>
                <td>{row.gold}</td>
                <td>{row.oil}</td>
                <td>{row.platinum}</td>
                <td>{row.silver}</td>
                <td>{row.palladium}</td>
                <td>{row.copper}</td>
                <td>{row.sugar}</td>
                <td>{row.cocoa}</td>
                <td>{row.wheat}</td>
                <td>{row.coffee}</td>
                <td>{row.soybean_oil}</td>
                <td>{row.corn}</td>
                <td>{row.nat_gas}</td>
                <td>{row.soybean}</td>
                <td>{row.soybean_meal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>No annual returns data available.</div>
      )}
    </div>
  );
};

export default AnnualReturns;
