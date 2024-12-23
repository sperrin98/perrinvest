import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // Import the CSS file
import StockDock from './StockDock';  // Import StockDock
import ChartCarousel from './ChartCarousel';  // Import ChartCarousel component
import coinImage from '../assets/images/coin.jpg';
import marketImage from '../assets/images/market-ratio.jpg';

const Home = () => {
  const [displayedText, setDisplayedText] = useState('');
  const text = "Perrinvest";

  useEffect(() => {
    let index = 0;
    const type = () => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
        setTimeout(type, 100); 
      } else {
        setTimeout(() => {
          setDisplayedText('');
          index = 0;
          type();
        }, 2000); 
      }
    };

    type();
  }, [text]);

  return (
    <div>
      <div className="section section1">
        <h1 className="home-header">Perrinvest</h1>
        <StockDock />
      </div>

      <div className="section section2">
        <h2 className='section2-header'>Trending Markets</h2>
        <ChartCarousel />
      </div>

      <div className="section section3">
        <h1 className="home-header">Currencies</h1>
        <div className="button-container">
          <Link to="/currencies" className='currency-btn'>Currencies</Link>
          <Link to="/currencies/divide" className='compare-btn'>Compare Currencies</Link>
          <Link to="/currencies/crypto" className='crypto-btn'>Cryptocurrencies</Link>
        </div>
        <div className="image-container">
          <img src={coinImage} alt="Coin" />
        </div>
      </div>

      <div className="section section4">
        <h1 className="market-ratio-home-header">Market Ratios</h1>
        <div className='button2-container'>
          <Link to="/market-ratios" className='market-ratio-button'>Market Ratios</Link>
          <Link to="/market-ratios/divide" className='compare-btn'>Compare Securities</Link>
        </div>
        <div className="image-container2">
          <img src={marketImage} alt="Market" />
        </div>
      </div>
    </div>
  );
};

export default Home;
