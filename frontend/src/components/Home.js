import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // Import the CSS file
import ChartCarousel from './ChartCarousel';
import coinImage from '../assets/images/coin.jpg';

const Home = () => {
  const [displayedText, setDisplayedText] = useState('');
  const text = "Perrinvest";

  useEffect(() => {
    let index = 0;
    const type = () => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
        setTimeout(type, 100); // Adjust typing speed here (100ms)
      } else {
        setTimeout(() => {
          setDisplayedText('');
          index = 0;
          type();
        }, 2000); // Adjust delay before restart here (2000ms)
      }
    };

    type(); 
  }, [text]);

  return (
    <div>
      <div className="section section1">
        <h1 className="home-header">{displayedText}</h1>
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
        <h1 className="home-header">Market Ratios</h1>
      </div>
    </div>
  );
};

export default Home;
