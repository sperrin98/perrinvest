import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Header.css'; // Import the CSS file for styling

const Header = ({ isLoggedIn, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleLogout = () => {
    // Call the logout handler
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
          <Link to="#">Precious Metals</Link>
          <div className="dropdown-content">
            <Link to='/precious-metals'>Annual Returns</Link>
            <Link to='/monthly-returns'>Monthly Returns</Link>
          </div>
        </li>


          {/* Dropdown for Securities */}
          <li className="dropdown">
            <Link to="/securities" className="dropbtn">Markets</Link>
            <div className="dropdown-content">
              <Link to="/securities">All Securities</Link>
              <Link to="/correlations">Correlations</Link>
            </div>
          </li>

          {/* Dropdown for Leagues & Ratios */}
          <li className="dropdown">
            <Link to="/market-ratios" className="dropbtn">Leagues & Ratios</Link>
            <div className="dropdown-content">
              <Link to="/market-ratios">Market Ratios</Link>
              <Link to="/market-leagues">Market Leagues</Link>
              <Link to="/market-ratios/divide">Compare Securities</Link>
            </div>
          </li>

          {/* Dropdown for Economical Data */}
          <li className="dropdown">
            <Link to="/eco-data-points" className="dropbtn">Economic Data</Link>
            <div className="dropdown-content">
              <Link to="/eco-data-points">Data Points</Link>
              <Link to="/returns">Returns</Link>
            </div>
          </li>

          {/* Dropdown for Currencies */}
          <li className="dropdown">
            <Link to="/currencies" className="dropbtn">Currencies</Link>
            <div className="dropdown-content">
              <Link to="/currencies">All Currencies</Link>
              <Link to="/currencies/divide">Compare Currencies</Link>
              <Link to="/currencies/crypto">Cryptocurrencies</Link>
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
