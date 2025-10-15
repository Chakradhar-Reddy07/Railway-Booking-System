import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';
import { saveToken } from '../services/auth';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

//   useEffect(() => {
//   const token = localStorage.getItem('rb_token');
//   if (token) navigate('/home');
// }, [navigate]);


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
    <div className="flex items-center justify-center min-h-screen px-4">
      <motion.form
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 dark:bg-gray-900/80 backdrop-blur-lg p-8 rounded-xl shadow-2xl w-full max-w-md"
        onSubmit={submit}
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-indigo-600 dark:text-indigo-400">
          Sign in
        </h2>
        {err && <div className="text-red-500 mb-4 text-center">{err}</div>}
        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-3 mb-4 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
          required
        />
        <button className="w-full py-3 mt-2 mb-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300">
          Sign in
        </button>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
          <Link to="/signup" className="hover:underline">
            Create account
          </Link>
          <Link to="/forgot" className="hover:underline">
            Forgot password?
          </Link>
        </div>
      </motion.form>
    </div>
  );
}
