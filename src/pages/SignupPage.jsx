import React, { useState } from 'react';
import { signup } from '../services/api';
import { saveToken } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const [form, setForm] = useState({ username: '', password: '', name: '', email: '', mobile_no: '' });
  const [err, setErr] = useState('');
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await signup(form);
      saveToken(res.token);
      nav('/home');
    } catch (err) {
      setErr(err.response?.data?.message || 'Signup failed');
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
          Create Account
        </h2>
        {err && <div className="text-red-500 mb-4 text-center">{err}</div>}
        <input
          placeholder="Username"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
          className="w-full p-3 mb-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
          required
        />
        <input
          placeholder="Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="w-full p-3 mb-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          className="w-full p-3 mb-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <input
          placeholder="Mobile"
          value={form.mobile_no}
          onChange={e => setForm({ ...form, mobile_no: e.target.value })}
          className="w-full p-3 mb-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          className="w-full p-3 mb-4 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
          required
        />
        <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300">
          Sign Up
        </button>
      </motion.form>
    </div>
  );
}
