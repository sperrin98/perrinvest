import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = ({ isLoggedIn, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogout = () => {
    onLogout();
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

          <li className="dropdown">
            <Link to="#">Returns</Link>
            <div className="dropdown-content">
              <Link to="/precious-metals">Daily Returns</Link>
              <Link to="/monthly-returns">Monthly Returns</Link>
              <Link to="/returns/1">Gold Returns in Currencies</Link>
              <Link to="/returns/2">Silver Returns in Currencies</Link>
            </div>

          </li>
          <li className="dropdown">
            <Link to="#">Charts</Link>
            <div className="dropdown-content">
              <Link to="/equity-markets">Equity Markets v Gold</Link>
              <Link to="/commodities">Commodities v Gold</Link>
            </div>
          </li>

          <li className="dropdown">
            <Link to="/securities" className="dropbtn">Markets</Link>
            <div className="dropdown-content">
              <Link to="/securities">All Securities</Link>
              <Link to="/correlations">Correlations</Link>
            </div>
          </li>

          <li className="dropdown">
            <Link to="/market-ratios" className="dropbtn">Leagues & Ratios</Link>
            <div className="dropdown-content">
              <Link to="/market-ratios">Market Ratios</Link>
              <Link to="/market-leagues">Market Leagues</Link>
              <Link to="/market-ratios/divide">Compare Securities</Link>
            </div>
          </li>

          <li className="dropdown">
            <Link to="/eco-data-points" className="dropbtn">Economic Data</Link>
            <div className="dropdown-content">
              <Link to="/eco-data-points">Data Points</Link>
              <Link to="/returns">Returns</Link>
            </div>
          </li>

          <li className="dropdown">
            <Link to="/currencies" className="dropbtn">Currencies</Link>
            <div className="dropdown-content">
              <Link to="/currencies">All Currencies</Link>
              <Link to="/currencies/divide">Compare Currencies</Link>
              <Link to="/currencies/crypto">Cryptocurrencies</Link>
            </div>
          </li>

          <li className="dropdown">
            <Link to="#" className="dropbtn">Blogs</Link>
            <div className="dropdown-content">
              <Link to="/blog">View Blogs</Link>
              {isLoggedIn && <Link to="/blog/create">Create Blog</Link>}
            </div>
          </li>

          {/* Login / Logout Logic */}
          {isLoggedIn ? (
            <li>
              <Link to="#" className="dropbtn" onClick={handleLogout}>Sign Out</Link>
            </li>
          ) : (
            <li className="dropdown">
              <Link to="#" className="dropbtn">Login</Link>
              <div className="dropdown-content">
                <Link to="/login">Login</Link>
                <Link to="/register">Create Account</Link>
              </div>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
