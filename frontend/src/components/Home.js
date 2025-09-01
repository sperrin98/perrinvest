import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import StockDock from './StockDock';
import ChartCarousel from './ChartCarousel';
import coinImage from '../assets/images/coin.jpg';
import marketImage from '../assets/images/market-ratio.jpg';

const Home = () => {
  const [commodities, setCommodities] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [stockMarkets, setStockMarkets] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchTrendingSecurities = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL;
        const response = await fetch(`${apiUrl}/trending-securities`);
        const data = await response.json();

        setCommodities([
          { name: 'Gold', performance: data['Gold']?.percent_change ?? "No Data" },
          { name: 'Cocoa', performance: data['Cocoa']?.percent_change ?? "No Data" },
          { name: 'Platinum', performance: data['Platinum']?.percent_change ?? "No Data" },
          { name: 'Natural Gas', performance: data['Natural Gas']?.percent_change ?? "No Data" },
          { name: 'Silver', performance: data['Silver']?.percent_change ?? "No Data" }
        ]);

        setCurrencies([
          { name: 'US Dollar', performance: data['US Dollar']?.percent_change ?? "No Data" },
          { name: 'British Pound', performance: data['British Pound']?.percent_change ?? "No Data" },
          { name: 'Bitcoin', performance: data['Bitcoin']?.percent_change ?? "No Data" },
          { name: 'Euro', performance: data['Euro']?.percent_change ?? "No Data" },
          { name: 'Australian Dollar', performance: data['Australian Dollar']?.percent_change ?? "No Data" }
        ]);

        setStockMarkets([
          { name: 'Dow Jones', performance: data['Dow Jones']?.percent_change ?? "No Data" },
          { name: 'Hang Seng', performance: data['Hang Seng']?.percent_change ?? "No Data" },
          { name: 'FTSE100', performance: data['FTSE100']?.percent_change ?? "No Data" },
          { name: 'DAX', performance: data['DAX']?.percent_change ?? "No Data" },
          { name: 'Shanghai Composite', performance: data['Shanghai Composite']?.percent_change ?? "No Data" }
        ]);
      } catch (error) {
        console.error('Error fetching trending securities:', error);
      }
    };

    fetchTrendingSecurities();
  }, []);

  const sections = [commodities, currencies, stockMarkets];
  const sectionTitles = ['Commodities', 'Currencies', 'Stock Markets'];

  const handleNext = () => setActiveIndex((prev) => (prev + 1) % sections.length);
  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + sections.length) % sections.length);

  return (
    <div>
      {/* Section 1 */}
      <div className="section section1">
        <h1 className="home-header">Perrinvest</h1>
        <StockDock />
      </div>

      {/* Section 2 */}
      <div className="section section2">
        <h2 className='section2-header'>Trending Markets</h2>
        <ChartCarousel />
      </div>

      {/* Section Securities */}
      <div className="section section-securities">
        <div className="securities-right">
          <h1 className="securities-header">Securities</h1>
          <div className="sec-button-container">
            <Link to="/securities" className="security-btn">Securities</Link>
            <Link to="/correlations" className="correlation-btn">Correlate Securities</Link>
          </div>
        </div>

        <div className="trending-container">
          <h1 className="trending-title">Trending Tickers</h1>
          <div className="carousel-wrapper">
            <button className="carousel-arrow carousel-arrow-left" onClick={handlePrev}>‹</button>
            <div className="trending-carousel">
              <div className="carousel-content">
                <h3 className="carousel-title">{sectionTitles[activeIndex]}</h3>
                <ul className="trending-securities">
                  {sections[activeIndex].map((item, index) => (
                    <li key={index}>
                      <span className="item-name">{item.name}</span>
                      <span className={`item-performance ${item.performance >= 0 ? 'positive' : 'negative'}`}>
                        {item.performance}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button className="carousel-arrow carousel-arrow-right" onClick={handleNext}>›</button>
          </div>
        </div>
      </div>

      {/* Section 3 */}
      <div className="section section3">
        <h1 className="home-header">Currencies</h1>
        <div className="button-container">
          <Link to="/currencies" className="currency-btn">Currencies</Link>
          <Link to="/currencies/divide" className="compare-btn">Compare Currencies</Link>
          <Link to="/currencies/crypto" className="crypto-btn">Cryptocurrencies</Link>
        </div>
        <div className="image-container">
          <img src={coinImage} alt="Coin" />
        </div>
      </div>

      {/* Section 4 */}
      <div className="section section4">
        <h1 className="market-ratio-home-header">Leagues & Ratios</h1>
        <div className="button2-container">
          <Link to="/market-ratios" className="market-ratio-button">Market Ratios</Link>
          <Link to="/market-ratios/divide" className="compare-btn">Compare Securities</Link>
          <Link to="/market-leagues" className="league-btn">Market Leagues</Link>
        </div>
        <div className="image-container2">
          <img src={marketImage} alt="Market" />
        </div>
      </div>
    </div>
  );
};

export default Home;
