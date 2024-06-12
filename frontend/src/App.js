import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Securities from './components/Securities';
import MarketRatios from './components/MarketRatios';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/securities" element={<Securities />} />
        <Route path="/market-ratios" element={<MarketRatios />} />
      </Routes>
    </Router>
  );
}

export default App;
