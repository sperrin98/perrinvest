import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios for making HTTP requests
import './Register.css'; // Import any necessary CSS

const Register = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic form validation
    if (!email || !username || !password) {
      setError('All fields are required.');
      return;
    }

    // Prepare the registration data
    const userData = { email, username, password };

    try {
      // Send the registration data to the backend
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/register`, userData);
      
      if (response.status === 201) {
        // If successful, call onLogin to update the state in App.js
        onLogin();
        
        // Redirect to home page
        navigate('/');
      }
    } catch (error) {
      // Handle registration errors
      setError('Registration failed. Please try again.');
      console.error('Registration error:', error.response.data);
    }
  };

  return (
    <div className="register-container">
      <h2>Create Account</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
