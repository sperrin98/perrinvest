import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

const Register = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !username || !password) {
      setError('All fields are required.');
      return;
    }

    const userData = { email, username, password };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/register`,
        userData
      );

      if (response.status === 201) {
        onLogin();
        navigate('/');
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', error.response?.data);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h2>Create Account</h2>
          <p className="register-subtitle">Set up your Perrinvest account</p>
        </div>

        {error && <p className="register-error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="register-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="register-field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="register-field">
            <label>Password</label>
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
    </div>
  );
};

export default Register;