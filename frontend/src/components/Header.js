import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Header.css";

const Header = ({ isLoggedIn, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState(null);
  const [desktopDropdown, setDesktopDropdown] = useState(null);

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
    setDesktopDropdown(null);
    if (document.activeElement) {
      document.activeElement.blur();
    }
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setMobileDropdown(null);
    setDesktopDropdown(null);
    if (document.activeElement) {
      document.activeElement.blur();
    }
  };

  const toggleMobileDropdown = (name) => {
    if (window.innerWidth <= 780) {
      setMobileDropdown((prev) => (prev === name ? null : name));
    }
  };

  const handleDesktopEnter = (name) => {
    if (window.innerWidth > 780) {
      setDesktopDropdown(name);
    }
  };

  const handleDesktopLeave = () => {
    if (window.innerWidth > 780) {
      setDesktopDropdown(null);
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
          <li
            className="dropdown"
            onMouseEnter={() => handleDesktopEnter("returns")}
            onMouseLeave={handleDesktopLeave}
          >
            <button
              className="nav-item-button"
              type="button"
              onClick={() => toggleMobileDropdown("returns")}
            >
              Returns
            </button>
            <div
              className={`dropdown-content ${
                mobileDropdown === "returns" || desktopDropdown === "returns"
                  ? "show-dropdown"
                  : ""
              }`}
            >
              <Link to="/precious-metals" onClick={closeMenu}>
                Precious Metals Daily Returns
              </Link>
              <Link to="/monthly-returns" onClick={closeMenu}>
                Precious Metals Monthly Returns
              </Link>
              <Link to="/rolling-returns" onClick={closeMenu}>
                Rolling Return / CAGR
              </Link>
              <Link to="/returns/1" onClick={closeMenu}>
                Gold Annual Returns by Currency
              </Link>
              <Link to="/returns/2" onClick={closeMenu}>
                Silver Annual Returns by Currency
              </Link>
              <Link to="/summary-data" onClick={closeMenu}>
                Summary Returns by Asset Class
              </Link>
              <Link to="/long-only-watchlist" onClick={closeMenu}>
                UK Shares and ETF Watchlist
              </Link>
            </div>
          </li>

          <li
            className="dropdown"
            onMouseEnter={() => handleDesktopEnter("charts")}
            onMouseLeave={handleDesktopLeave}
          >
            <button
              className="nav-item-button"
              type="button"
              onClick={() => toggleMobileDropdown("charts")}
            >
              Charts
            </button>
            <div
              className={`dropdown-content ${
                mobileDropdown === "charts" || desktopDropdown === "charts"
                  ? "show-dropdown"
                  : ""
              }`}
            >
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
              <Link to="/charts/us-federal-debt-priced-in-gold" onClick={closeMenu}>
                US Federal Debt v Gold
              </Link>
              <Link to="/rebased-comparison" onClick={closeMenu}>
                Rebased Comparison
              </Link>
            </div>
          </li>

          <li
            className="dropdown"
            onMouseEnter={() => handleDesktopEnter("correlations")}
            onMouseLeave={handleDesktopLeave}
          >
            <button
              className="nav-item-button"
              type="button"
              onClick={() => toggleMobileDropdown("correlations")}
            >
              Correlations
            </button>
            <div
              className={`dropdown-content ${
                mobileDropdown === "correlations" || desktopDropdown === "correlations"
                  ? "show-dropdown"
                  : ""
              }`}
            >
              <Link to="/correlations" onClick={closeMenu}>
                Comparing Securities
              </Link>
              <Link to="/correlation-matrix" onClick={closeMenu}>
                Correlation Matrix
              </Link>
            </div>
          </li>

          <li
            className="dropdown"
            onMouseEnter={() => handleDesktopEnter("ratios")}
            onMouseLeave={handleDesktopLeave}
          >
            <button
              className="nav-item-button"
              type="button"
              onClick={() => toggleMobileDropdown("ratios")}
            >
              Leagues & Ratios
            </button>
            <div
              className={`dropdown-content ${
                mobileDropdown === "ratios" || desktopDropdown === "ratios"
                  ? "show-dropdown"
                  : ""
              }`}
            >
              <Link to="/market-ratios" onClick={closeMenu}>
                Market Ratios
              </Link>
              <Link to="/market-leagues" onClick={closeMenu}>
                Market Leagues
              </Link>
            </div>
          </li>

          <li
            className="dropdown"
            onMouseEnter={() => handleDesktopEnter("blogs")}
            onMouseLeave={handleDesktopLeave}
          >
            <button
              className="nav-item-button"
              type="button"
              onClick={() => toggleMobileDropdown("blogs")}
            >
              Blogs
            </button>
            <div
              className={`dropdown-content ${
                mobileDropdown === "blogs" || desktopDropdown === "blogs"
                  ? "show-dropdown"
                  : ""
              }`}
            >
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
            <li
              className="dropdown"
              onMouseEnter={() => handleDesktopEnter("login")}
              onMouseLeave={handleDesktopLeave}
            >
              <button
                className="nav-item-button"
                type="button"
                onClick={() => toggleMobileDropdown("login")}
              >
                Login
              </button>
              <div
                className={`dropdown-content dropdown-content-right ${
                  mobileDropdown === "login" || desktopDropdown === "login"
                    ? "show-dropdown"
                    : ""
                }`}
              >
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