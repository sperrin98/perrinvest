import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css'; // Import the CSS file for styling

const Header = () => {
  return (
    <header className="header">
      <nav className="navbar">
        <div className="brand">
          <Link to="/" className="logo">Perrinvest</Link>
        </div>
        <ul className="nav-links">
          <li><Link to="/securities">Securities</Link></li>
          <li className='dropdown'>
              <Link to="/market-ratios" className="dropbtn">Market Ratios</Link>
              <div className="dropdown-content">
                <Link to="/market-ratios">All Market Ratios</Link>
                <Link to="/market-ratios/divide">Compare Securities</Link>
              </div>
            </li>
          <li><Link to="/eco-data-points">Economical Data</Link></li>
          <li className="dropdown">
            <Link to="/currencies" className="dropbtn">Currencies</Link>
            <div className="dropdown-content">
              <Link to="/currencies">All Currencies</Link>
              <Link to="/currencies/divide">Compare Currencies</Link>
              <Link to="/currencies/crypto">Cryptocurrencies</Link>
            </div>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
