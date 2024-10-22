// src/pages/Returns.js
import React from 'react';
import { Link } from 'react-router-dom';

const Returns = () => {
  return (
    <div>
      <h1>Annual Returns in Major Currencies</h1>
      <ul>
        <li><Link to="/returns/1">Gold Price Returns</Link></li>
        <li><Link to="/returns/2">Silver Price Returns</Link></li>
      </ul>
    </div>
  );
};

export default Returns;
