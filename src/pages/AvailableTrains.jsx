import React, { useState } from 'react';
import { getAvailableTrains } from '../services/api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Background3D from '../components/Background3D'; // ⬅️ adjust path as needed

export default function AvailableTrains() {
  const [query, setQuery] = useState({
    from: 'S_BHP',
    to: 'S_HYD',
    date: '2025-11-01'
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search(e) {
    e?.preventDefault();
    setLoading(true);
    setSearched(true);
    try {
      const res = await getAvailableTrains(query);
      setResults(res);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start py-10 px-6 overflow-hidden">
      {/* 🎥 3D Background Layer */}
      <div className="absolute inset-0 z-0">
        <Background3D />
      </div>

      {/* 🌟 Foreground Content */}
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Header */}
        <motion.h2
          className="text-3xl font-bold mb-8 text-indigo-600 dark:text-indigo-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Search Trains
        </motion.h2>

        {/* Search Form */}
        <motion.form
          onSubmit={search}
          className="flex flex-wrap gap-3 mb-10 bg-white/70 dark:bg-gray-800/70 p-6 rounded-2xl shadow-lg backdrop-blur-md w-full max-w-3xl justify-center text-gray-800 dark:text-gray-100 transition-colors duration-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <input
            value={query.from}
            onChange={(e) => setQuery({ ...query, from: e.target.value })}
            placeholder="From (Station ID)"
            className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none w-40"
          />
          <input
            value={query.to}
            onChange={(e) => setQuery({ ...query, to: e.target.value })}
            placeholder="To (Station ID)"
            className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none w-40"
          />
          <input
            type="date"
            value={query.date}
            onChange={(e) => setQuery({ ...query, date: e.target.value })}
            className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none w-40"
          />
         
          <button
            type="submit"
            className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-6 shadow-lg transition-all"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </motion.form>

        {/* Results */}
        <div className="grid gap-4 w-full max-w-3xl">
          {loading && <div className="text-center text-indigo-500">Loading...</div>}
          {!loading && searched && results.length === 0 && (
            <div className="text-center text-gray-600 dark:text-gray-300">No trains found</div>
          )}

          {results.map((r) => (
            <motion.div
             key={`${r.train_id}-${r.class_type}`}
              className="p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-xl flex justify-between items-center hover:scale-[1.03] transition-transform text-gray-800 dark:text-gray-100 backdrop-blur-sm"
              whileHover={{ scale: 1.03 }}
            >
              <div>
                <strong className="text-lg text-gray-900 dark:text-gray-100">{r.train_name}</strong>
                <div className="text-gray-600 dark:text-gray-300">
                  Class: {r.class_type} • Avl: {r.available_seats}
                </div>

              </div>
              <Link
                to={`/home/confirm/${encodeURIComponent(r.train_id)}/${encodeURIComponent(query.from)}/${encodeURIComponent(query.to)}/${encodeURIComponent(query.date)}/${encodeURIComponent(r.class_type)}`}
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-4 py-2 shadow-lg"
              >
                Book
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
