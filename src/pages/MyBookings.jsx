import React, { useEffect, useState } from 'react';
import { myBookings } from '../services/api';
import { motion } from 'framer-motion';

export default function MyBookings() {
  const [list, setList] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await myBookings();
        setList(res);
      } catch (err) { console.error(err); }
    }
    load();
  }, []);

  return (
    <div className="page p-6 flex flex-col items-center">
      <motion.h2 className="text-3xl font-bold mb-6 text-indigo-600 dark:text-indigo-400"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        My Bookings
      </motion.h2>

      <div className="grid gap-4 w-full max-w-3xl">
        {list.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-300">No bookings yet</div>
        ) : list.map(t => (
          <motion.div
            key={t.ticket_id}
            className="card p-4 bg-white/80 dark:bg-gray-900/70 rounded-xl shadow-xl hover:scale-105 transform transition-all duration-300"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-gray-800 dark:text-gray-200 font-semibold">{t.ticket_id} • {t.class_type} • Status: {t.status}</div>
            <div className="text-gray-600 dark:text-gray-400">Travel Date: {t.travel_date} • Amount: ₹{t.total_amount}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
