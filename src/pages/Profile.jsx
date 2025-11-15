import React, { useEffect, useState } from 'react';
import { profile } from '../services/api';
import { motion } from 'framer-motion';

export default function Profile() {
  const [p, setP] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await profile();
        setP(res);
      } catch (err) { console.error(err); }
    }
    load();
  }, []);

  if (!p) return <div className="text-center text-indigo-500">Loading profile...</div>;

  return (
    <div className="flex justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-white/90 dark:bg-gray-900/70 p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{p.name || p.username}</h2>
        <div className="text-gray-700 dark:text-gray-300">Email: {p.email}</div>
        <div className="text-gray-700 dark:text-gray-300">Mobile: {p.mobile_no}</div>
        <div className="text-gray-700 dark:text-gray-300">City: {p.city} • State: {p.state}</div>
      </motion.div>
    </div>
  );
}
