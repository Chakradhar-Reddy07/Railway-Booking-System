import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { removeToken } from '../services/auth';
import { motion } from 'framer-motion';

export default function Navbar({ setTheme, theme }) {
  const nav = useNavigate();
  function logout() { removeToken(); nav('/'); }

  return (
    <motion.header
      className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50"
      initial={{ y:-100 }} animate={{ y:0 }} transition={{ duration:0.5 }}
    >
      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">Railway</div>
      <nav className="space-x-4 hidden md:flex">
        <Link to="/home" className="hover:text-blue-500 transition">Home</Link>
        <Link to="/home/trains" className="hover:text-blue-500 transition">Available Trains</Link>
        <Link to="/home/mybookings" className="hover:text-blue-500 transition">My Bookings</Link>
        <Link to="/home/profile" className="hover:text-blue-500 transition">Profile</Link>
      </nav>
      <div className="space-x-2">
        <motion.button
          className="btn tiny bg-gray-200 dark:bg-gray-700"
          whileHover={{ rotate: theme==='light'?180:0 }}
          onClick={() => setTheme(theme==='light' ? 'dark' : 'light')}
        >
          {theme==='light' ? '🌙' : '☀️'}
        </motion.button>
        <button className="btn tiny bg-red-500 text-white hover:bg-red-600" onClick={logout}>
          Logout
        </button>
      </div>
    </motion.header>
  );
}
