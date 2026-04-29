import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

const Register = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    if (!email || !username || !password) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);

    try {
      const registerResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/register`,
        {
          email,
          username,
          password,
        }
      );

      if (registerResponse.status !== 201) {
        setError('Registration failed. Please try again.');
        return;
      }

      const loginResponse = await axios.post(
        `${process.env.REACT_APP_API_URL}/login`,
        {
          email,
          password,
        }
      );

      if (loginResponse.status === 200) {
        if (onLogin) {
          onLogin({
            user_id: loginResponse.data.user_id,
            username: loginResponse.data.username,
            is_admin: loginResponse.data.is_admin,
          });
        }

        navigate('/');
      }
    } catch (err) {
      console.error('Registration error:', err.response?.data || err.message);

      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
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

          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;