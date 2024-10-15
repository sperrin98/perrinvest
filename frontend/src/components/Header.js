import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css'; // Import the CSS file for styling

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="header">
      <nav className="navbar">
        <div className="brand">
          <Link to="/" className="logo">Perrinvest</Link>
        </div>
        <button className="menu-toggle" onClick={toggleMenu}>
          ☰ Menu
        </button>
        <ul className={`nav-links ${menuOpen ? 'show' : ''}`}>
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
          <li><Link to="/correlations">Correlations</Link></li>
          <li className='dropdown'>
            <Link to="#" className="dropbtn">Login</Link>
            <div className="dropdown-content">
              <Link to="/login">Login</Link>
              <Link to="/register">Create Account</Link>
            </div>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
