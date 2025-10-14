import React, { useState, useEffect } from 'react';
import StockDock from './StockDock';
import { Sparklines, SparklinesLine } from 'react-sparklines';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const [securities, setSecurities] = useState([]);

  // ONLY the IDs you care about
  const relevantIds = [
    36, 37, 38, 149, 81, 153, 154, 155, 156, // Precious Metals
    1, 2, 3, 4, 6, 7, 8, 11, 12,            // Stock Markets
    16, 17, 18, 19, 20, 21, 22, 24, 29      // Currencies
  ];

  useEffect(() => {
    const fetchSecurities = async () => {
      try {
        // Fetch all securities
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/securities`);
        const allSecurities = response.data;

        // Filter only the securities we care about
        const filteredSecurities = allSecurities.filter((sec) =>
          relevantIds.includes(sec.security_id)
        );

        // Fetch last 5 prices for relevant securities
        const pricePromises = filteredSecurities.map(async (sec) => {
          try {
            const priceResponse = await axios.get(
              `${process.env.REACT_APP_API_URL}/securities/${sec.security_id}/price-histories`
            );
            const rawData = priceResponse.data;

            // Sort by date ascending
            const sorted = Array.isArray(rawData)
              ? rawData.sort((a, b) => new Date(a[1]) - new Date(b[1]))
              : [];

            // Take last 5 valid prices
            const last5Prices = sorted
              .map((p) => p[2])
              .filter((p) => p != null)
              .slice(-5);

            console.log(`Security: ${sec.security_long_name}`);
            console.log(last5Prices);

            return { ...sec, last5Prices };
          } catch (err) {
            console.error(`Error fetching prices for ${sec.security_long_name}:`, err);
            return { ...sec, last5Prices: [] };
          }
        });

        const securitiesWithPrices = await Promise.all(pricePromises);
        setSecurities(securitiesWithPrices);
      } catch (err) {
        console.error('Error fetching securities:', err);
      }
    };

    fetchSecurities();
  }, []);

  const renderTable = (ids, title) => {
    const filtered = securities.filter((sec) => ids.includes(sec.security_id));

    return (
      <div className="summary-table-block">
        <h3 className="summary-table-title">{title}</h3>
        <table className="summary-table-wrapper">
          <thead>
            <tr className="summary-table-row-header">
              <th className="summary-table-header-security">Security</th>
              <th className="summary-table-header-value">Most Recent Price</th>
              <th className="summary-table-header-value">Trend (Last 5)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sec, idx) => {
              const prices = sec.last5Prices || [];
              const price = prices.length ? prices[prices.length - 1].toFixed(2) : 'N/A';

              // Determine sparkline color based on trend (older → newer)
              let sparkColor = '#00FFB3'; // green by default
              if (prices.length >= 2) {
                const first = prices[0];
                const last = prices[prices.length - 1];
                sparkColor = last > first ? '#00FFB3' : last < first ? '#FF4C4C' : '#CCCCCC';
              }

              return (
                <tr key={idx} className="summary-table-row-data">
                  <td className="summary-table-data-security">{sec.security_long_name}</td>
                  <td
                    className="summary-table-data-value"
                    style={{ color: sparkColor }} // match sparkline color
                  >
                    {price}
                  </td>
                  <td className="summary-table-data-value">
                    {prices.length > 0 ? (
                      <Sparklines data={prices} width={100} height={20}>
                        <SparklinesLine color={sparkColor} />
                      </Sparklines>
                    ) : (
                      'N/A'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div className="section section1">
        <StockDock />
        <div className="summary-data">
          {securities.length > 0 ? (
            <>
              {renderTable([36, 37, 38, 149, 81, 153, 154, 155, 156], 'Precious Metals')}
              {renderTable([1, 2, 3, 4, 6, 7, 8, 11, 12], 'Stock Markets')}
              {renderTable([16, 17, 18, 19, 20, 21, 22, 24, 29], 'Currencies')}
            </>
          ) : (
            <p>Loading summary data...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
