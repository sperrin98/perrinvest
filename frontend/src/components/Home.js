import React, { useState, useEffect } from 'react';
import './Home.css'; // Import the CSS file
import ChartCarousel from './ChartCarousel';

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
      <div className="section1">
        <h1 className="home-header">{displayedText}</h1>
      </div>
      <div className="section4">
        <h2 className='section2-header'>Trending Markets</h2>
        <ChartCarousel />
      </div>
      <div className="section2">
        <h1 className="home-header">Securities</h1>
      </div>
      <div className="section3">
        <h1 className="home-header">Market Ratios</h1>
      </div>
    </div>
  );
};

export default Home;
