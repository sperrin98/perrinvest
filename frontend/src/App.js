import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import Securities from './components/Securities';
import Security from './components/Security';
import MarketRatios from './components/MarketRatios';
import EcoDataPoints from './components/EcoDataPoints';
import EcoDataPoint from './components/EcoDataPoint';
import Currencies from './components/Currencies';
import Currency from './components/Currency';
import Correlations from './components/Correlations';
import CorrelationMatrix from './components/CorrelationMatrix';
import Login from './components/Login';
import Register from './components/Register';
import Returns from './components/Returns';
import GoldReturns from './components/GoldReturns';
import SilverReturns from './components/SilverReturns';
import StockMarketReturn from './components/StockMarketReturn';
import AnnualReturns from './components/AnnualReturns';
import NwHpi from './components/NwHpi';
import MarketLeagues from './components/MarketLeagues';
import PreciousMetals from './components/PreciousMetals';
import MonthlyReturns from './components/MonthlyReturns';
import EquityMarkets from './components/EquityMarkets';
import Commodities from './components/Commodities';
import BlogList from './components/BlogList';
import BlogPost from './components/BlogPost';
import CreateBlogPost from './components/CreateBlogPost';
import SummaryData from './components/SummaryData';
import LongOnlyWatchlist from './components/LongOnlyWatchlist';
import BondYields from './components/BondYields';
import FederalDebtGold from './components/FederalDebtGold';
import RebasedComparison from './components/RebasedComparison';
import RollingReturns from './components/RollingReturns';
import Drawdowns from './components/Drawdowns';
import Petrol from "./components/Petrol";
import Seasonality from "./components/Seasonality";
import Volatility from "./components/Volatility";
import VolatilityComparison from "./components/VolatilityComparison";
import Inflation from "./components/Inflation";

const AdminRoute = ({ isLoggedIn, isAdmin, children }) => {
  if (!isLoggedIn) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/" />;
  return children;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const storedUserId = localStorage.getItem('userId');
    const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';
    if (loggedIn) {
      setIsLoggedIn(true);
      setUserId(storedUserId);
      setIsAdmin(storedIsAdmin);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUserId(userData.user_id);
    setIsAdmin(userData.is_admin);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userId', userData.user_id);
    localStorage.setItem('isAdmin', userData.is_admin);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserId(null);
    setIsAdmin(false);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    localStorage.removeItem('isAdmin');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/securities" element={<Securities />} />
        <Route path="/securities/:id" element={<Security />} />
        <Route path="/market-ratios" element={<MarketRatios />} />
        <Route path="/eco-data-points" element={<EcoDataPoints />} />
        <Route path="/eco-data-points/:id" element={<EcoDataPoint />} />
        <Route path="/currencies" element={<Currencies />} />
        <Route path="/currencies/:id" element={<Currency />} />
        <Route path="/correlations" element={<Correlations />} />
        <Route path="/correlation-matrix" element={<CorrelationMatrix />} />
        <Route path="/rebased-comparison" element={<RebasedComparison />} />
        <Route path="/rolling-returns" element={<RollingReturns />} />
        <Route path="/drawdowns" element={<Drawdowns />} />
        <Route path="/charts/us-federal-debt-priced-in-gold" element={<FederalDebtGold />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register onLogin={handleLogin} />} />
        <Route path="/returns" element={<Returns />} />
        <Route path="/returns/1" element={<GoldReturns />} />
        <Route path="/returns/2" element={<SilverReturns />} />
        <Route path="/stockmarketreturn/:id" element={<StockMarketReturn />} />
        <Route path="/annualreturns" element={<AnnualReturns />} />
        <Route path="/nw-hpi/:id" element={<NwHpi />} />
        <Route path="/market-leagues" element={<MarketLeagues />} />
        <Route path="/precious-metals" element={<PreciousMetals />} />
        <Route path="/monthly-returns" element={<MonthlyReturns />} />
        <Route path="/equity-markets" element={<EquityMarkets />} />
        <Route path="/commodities" element={<Commodities />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        <Route path="/summary-data" element={<SummaryData />} />
        <Route path="/long-only-watchlist" element={<LongOnlyWatchlist />} />
        <Route path="/bond-yields" element={<BondYields />} />
        <Route path="/petrol" element={<Petrol />} />
        <Route path="/seasonality" element={<Seasonality />} />
        <Route path="/volatility" element={<Volatility />} />
        <Route path="/volatility-comparison" element={<VolatilityComparison />} />
        <Route path="/inflation" element={<Inflation />} />
        <Route
          path="/blog/create"
          element={
            <AdminRoute isLoggedIn={isLoggedIn} isAdmin={isAdmin}>
              <CreateBlogPost authorId={userId} />
            </AdminRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;