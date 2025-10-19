import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ isLoggedIn, isAdmin, children }) => {
  if (!isLoggedIn) return <Navigate to="/" />;  // Not logged in → homepage
  if (!isAdmin) return <Navigate to="/" />;     // Logged in but not admin → homepage
  return children;                               // Logged in & admin → show page
};

export default AdminRoute;
