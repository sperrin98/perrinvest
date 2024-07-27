import React from 'react';
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

function App() {
  return (
    <Router>
      <Header />
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
      </Routes>
    </Router>
  );
}

export default App;
