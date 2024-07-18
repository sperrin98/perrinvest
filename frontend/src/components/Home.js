import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // Import the CSS file
import parallaxImage from '../assets/images/parallax-image.png'; // Correct path

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
    <div className="home-container">
      <div className="parallax-background"></div>
      <div className="content-container">
        <h1 className="home-header">{displayedText}</h1>
        <div className="home-buttons">
          <Link to="/securities">
            <div className="center">
              <button className="btn">
                <svg width="180px" height="60px" viewBox="0 0 180 60" className="border">
                  <polyline points="179,1 179,59 1,59 1,1 179,1" className="bg-line" />
                  <polyline points="179,1 179,59 1,59 1,1 179,1" className="hl-line" />
                </svg>
                <span>Securities</span>
              </button>
            </div>
          </Link>
        </div>
        <div className="home-buttons">
          <Link to="/market-ratios">
            <div className="center">
              <button className="btn">
                <svg width="180px" height="60px" viewBox="0 0 180 60" className="border">
                  <polyline points="179,1 179,59 1,59 1,1 179,1" className="bg-line" />
                  <polyline points="179,1 179,59 1,59 1,1 179,1" className="hl-line" />
                </svg>
                <span>Market Ratios</span>
              </button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
