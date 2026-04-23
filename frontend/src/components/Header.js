import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp, Menu, X } from "lucide-react";
import "./Header.css";

const Header = ({ isLoggedIn, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState(null);
  const [desktopDropdown, setDesktopDropdown] = useState(null);

  const toggleMenu = () => {
    setMenuOpen((prev) => {
      const next = !prev;
      if (!next) {
        setMobileDropdown(null);
      }
      return next;
    });
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

  const renderDropdownButton = (label, name) => {
    const isOpen = mobileDropdown === name || desktopDropdown === name;

    return (
      <button
        className="nav-item-button nav-item-button-dropdown"
        type="button"
        onClick={() => toggleMobileDropdown(name)}
        aria-expanded={isOpen}
        aria-controls={`${name}-submenu`}
      >
        <span>{label}</span>
        <span className="nav-dropdown-icon" aria-hidden="true">
          {mobileDropdown === name ? (
            <ChevronUp size={16} strokeWidth={2.2} />
          ) : (
            <ChevronDown size={16} strokeWidth={2.2} />
          )}
        </span>
      </button>
    );
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
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          type="button"
        >
          {menuOpen ? <X size={17} strokeWidth={2.2} /> : <Menu size={17} strokeWidth={2.2} />}
          <span>{menuOpen ? "Close" : "Menu"}</span>
        </button>

        <ul
          id="primary-navigation"
          className={`nav-links ${menuOpen ? "show" : ""}`}
        >
          <li
            className="dropdown"
            onMouseEnter={() => handleDesktopEnter("returns")}
            onMouseLeave={handleDesktopLeave}
          >
            {renderDropdownButton("Returns", "returns")}
            <div
              id="returns-submenu"
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
              <Link to="/drawdowns" onClick={closeMenu}>
                Drawdowns
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
            {renderDropdownButton("Charts", "charts")}
            <div
              id="charts-submenu"
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
              <Link to="/petrol" onClick={closeMenu}>
                Petrol Prices
              </Link>
              <Link to="/volatility" onClick={closeMenu}>
                Volatility
              </Link>
              <Link to="/volatility-comparison" onClick={closeMenu}>
                Volatility Comparison
              </Link>
              <Link to="/inflation" onClick={closeMenu}>
                Inflation Analysis
              </Link>
            </div>
          </li>

          <li
            className="dropdown"
            onMouseEnter={() => handleDesktopEnter("seasonality")}
            onMouseLeave={handleDesktopLeave}
          >
            {renderDropdownButton("Seasonality", "seasonality")}
            <div
              id="seasonality-submenu"
              className={`dropdown-content ${
                mobileDropdown === "seasonality" || desktopDropdown === "seasonality"
                  ? "show-dropdown"
                  : ""
              }`}
            >
              <Link to="/seasonality" onClick={closeMenu}>
                Seasonality
              </Link>
              <Link to="/seasonality-rebased" onClick={closeMenu}>
                Rebased Seasonality Comparison
              </Link>
              <Link to="/mean-seasonality" onClick={closeMenu}>
                Mean Seasonality
              </Link>
            </div>
          </li>

          <li
            className="dropdown"
            onMouseEnter={() => handleDesktopEnter("correlations")}
            onMouseLeave={handleDesktopLeave}
          >
            {renderDropdownButton("Correlations", "correlations")}
            <div
              id="correlations-submenu"
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
            {renderDropdownButton("Leagues & Ratios", "ratios")}
            <div
              id="ratios-submenu"
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
            {renderDropdownButton("Blogs", "blogs")}
            <div
              id="blogs-submenu"
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
              {renderDropdownButton("Login", "login")}
              <div
                id="login-submenu"
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