import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home';
import Securities from './components/Securities';
import Security from './components/Security';
import MarketRatios from './components/MarketRatios';
import MarketRatio from './components/MarketRatio';

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
      </Routes>
    </Router>
  );
}

export default App;
