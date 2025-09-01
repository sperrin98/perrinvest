// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import Securities from './components/Securities';
import Security from './components/Security';
import MarketRatios from './components/MarketRatios';
import MarketRatio from './components/MarketRatio';
import EcoDataPoints from './components/EcoDataPoints';
import EcoDataPoint from './components/EcoDataPoint';
import Currencies from './components/Currencies';
import Currency from './components/Currency';
import CurrencySelection from './components/CurrencySelection';
import MarketRatioSelection from './components/MarketRatioSelection';
import CryptoCurrencies from './components/CryptoCurrencies';
import CryptoCurrency from './components/CryptoCurrency';
import Correlations from './components/Correlations';
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

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <Header isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/securities" element={<Securities />} />
        <Route path="/securities/:id" element={<Security />} />
        <Route path="/market-ratios" element={<MarketRatios />} />
        <Route path="/market-ratios/:id" element={<MarketRatio />} />
        <Route path="/eco-data-points" element={<EcoDataPoints />} />
        <Route path="/eco-data-points/:id" element={<EcoDataPoint />} />
        <Route path="/currencies" element={<Currencies />} />
        <Route path="/currencies/:id" element={<Currency />} />
        <Route path="/currencies/divide" element={<CurrencySelection />} />
        <Route path="/market-ratios/divide" element={<MarketRatioSelection />} />
        <Route path="/currencies/crypto" element={<CryptoCurrencies />} />
        <Route path="/currencies/crypto/:ticker" element={<CryptoCurrency />} />
        <Route path="/correlations" element={<Correlations />} />
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
      </Routes>
    </Router>
  );
}

export default App;
