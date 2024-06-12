import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <h1>Welcome to Perrinvest</h1>
      <div>
        <Link to="/securities">
          <button>Go to Securities</button>
        </Link>
      </div>
      <div>
        <Link to="/market-ratios">
          <button>Go to Market Ratios</button>
        </Link>
      </div>
    </div>
  );
}

export default Home;
