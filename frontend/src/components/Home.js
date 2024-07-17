import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // Import the CSS file

const Home = () => {
  const [displayedText, setDisplayedText] = useState('');
  const text = "Welcome to Perrinvest";

  useEffect(() => {
    let index = 0;
    const type = () => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
        setTimeout(type, 80); // Adjust typing speed here (100ms)
      } else {
        setTimeout(() => {
          setDisplayedText('');
          index = 0;
          type();
        }, 1000); // Adjust delay before restart here (2000ms)
      }
    };

    type();
  }, [text]);

  return (
    <div className="home-container">
      <h1 className="home-header">{displayedText}</h1>
      <div className="home-buttons">
        <Link to="/securities">
          <button>Go to Securities</button>
        </Link>
      </div>
      <div className="home-buttons">
        <Link to="/market-ratios">
          <button>Go to Market Ratios</button>
        </Link>
      </div>
    </div>
  );
};

export default Home;
