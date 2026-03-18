import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Header.css";

const Header = ({ isLoggedIn, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState(null);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
    if (menuOpen) {
      setMobileDropdown(null);
    }
  };

  const handleLogout = () => {
    onLogout();
    setMenuOpen(false);
    setMobileDropdown(null);
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setMobileDropdown(null);
  };

  const toggleMobileDropdown = (name) => {
    if (window.innerWidth <= 780) {
      setMobileDropdown((prev) => (prev === name ? null : name));
    }
  };

  return (
    <header className="header">
      <nav className="navbar">
        <div className="brand">
          <Link
            to="/"
            className="logo-link"
            aria-label="Perrinvest home"
            onClick={closeMenu}
          >
            <img
              src="/logo101.png"
              alt="Perrinvest Logo"
              className="logo-img"
            />
          </Link>
        </div>

        <button
          className="menu-toggle"
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
          type="button"
        >
          ☰ Menu
        </button>

        <ul className={`nav-links ${menuOpen ? "show" : ""}`}>
          <li className="dropdown">
            <button
              className="nav-item-button"
              type="button"
              onClick={() => toggleMobileDropdown("returns")}
            >
              Returns
            </button>
            <div className={`dropdown-content ${mobileDropdown === "returns" ? "show-mobile" : ""}`}>
              <Link to="/precious-metals" onClick={closeMenu}>
                Daily Returns
              </Link>
              <Link to="/monthly-returns" onClick={closeMenu}>
                Monthly Returns
              </Link>
              <Link to="/returns/1" onClick={closeMenu}>
                Gold Returns in Currencies
              </Link>
              <Link to="/returns/2" onClick={closeMenu}>
                Silver Returns in Currencies
              </Link>
              <Link to="/summary-data" onClick={closeMenu}>
                Summary Returns
              </Link>
              <Link to="/long-only-watchlist" onClick={closeMenu}>
                UK Shares and ETF Watchlist
              </Link>
            </div>
          </li>

          <li className="dropdown">
            <button
              className="nav-item-button"
              type="button"
              onClick={() => toggleMobileDropdown("charts")}
            >
              Charts
            </button>
            <div className={`dropdown-content ${mobileDropdown === "charts" ? "show-mobile" : ""}`}>
              <Link to="/securities" onClick={closeMenu}>
                All Securities
              </Link>
              <Link to="/bond-yields" onClick={closeMenu}>
                Bond Yields
              </Link>
              <Link to="/eco-data-points" onClick={closeMenu}>
                House Price Index
              </Link>
              <Link to="/equity-markets" onClick={closeMenu}>
                Equity Markets v Gold
              </Link>
              <Link to="/commodities" onClick={closeMenu}>
                Commodities v Gold
              </Link>
              <Link to="/correlations" onClick={closeMenu}>
                Correlations
              </Link>
            </div>
          </li>

          <li className="dropdown">
            <Link
              to="/market-ratios"
              className="nav-item-link"
              onClick={closeMenu}
            >
              Leagues & Ratios
            </Link>
            <div className={`dropdown-content ${mobileDropdown === "ratios" ? "show-mobile" : ""}`}>
              <Link to="/market-ratios" onClick={closeMenu}>
                Market Ratios
              </Link>
              <Link to="/market-leagues" onClick={closeMenu}>
                Market Leagues
              </Link>
              <Link to="/market-ratios/divide" onClick={closeMenu}>
                Compare Securities
              </Link>
            </div>
          </li>

          <li className="dropdown">
            <button
              className="nav-item-button"
              type="button"
              onClick={() => toggleMobileDropdown("blogs")}
            >
              Blogs
            </button>
            <div className={`dropdown-content ${mobileDropdown === "blogs" ? "show-mobile" : ""}`}>
              <Link to="/blog" onClick={closeMenu}>
                View Blogs
              </Link>
              {isLoggedIn && (
                <Link to="/blog/create" onClick={closeMenu}>
                  Create Blog
                </Link>
              )}
            </div>
          </li>

          {isLoggedIn ? (
            <li>
              <button
                type="button"
                className="nav-item-button nav-signout"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </li>
          ) : (
            <li className="dropdown">
              <button
                className="nav-item-button"
                type="button"
                onClick={() => toggleMobileDropdown("login")}
              >
                Login
              </button>
              <div className={`dropdown-content dropdown-content-right ${mobileDropdown === "login" ? "show-mobile" : ""}`}>
                <Link to="/login" onClick={closeMenu}>
                  Login
                </Link>
                <Link to="/register" onClick={closeMenu}>
                  Create Account
                </Link>
              </div>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;