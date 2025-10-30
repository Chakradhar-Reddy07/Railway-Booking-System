import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import { saveToken } from '../services/auth';
import { motion } from 'framer-motion';
import './LoginPage.css'; // <-- add this line for styling

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await login({ username, password });
      saveToken(res.token);
      navigate('/home');
    } catch (err) {
      setErr(err.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="login-page">
      <div className="overlay" />
      <motion.form
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="login-box"
        onSubmit={submit}
      >
        <h2 className="login-title">🚆 Railway Booking Portal</h2>
        <h3 className="login-subtitle">Sign in to continue</h3>

        {err && <div className="error-msg">{err}</div>}

        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="input-field"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="input-field"
          required
        />

        <button className="login-btn">Sign In</button>

        <div className="login-links">
          <Link to="/signup" className="link">Create account</Link>
          <Link to="/forgot" className="link">Forgot password?</Link>
        </div>
      </motion.form>
    </div>
  );
}
