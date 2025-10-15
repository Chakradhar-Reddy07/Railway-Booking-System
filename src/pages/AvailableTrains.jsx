import React, { useState } from 'react';
import { getAvailableTrains } from '../services/api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function AvailableTrains() {
  const [query, setQuery] = useState({
    from: 'S_HYD',
    to: 'S_NDL',
    date: '2025-11-20',
    class_type: '3A'
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
    <div className="min-h-screen flex flex-col items-center justify-start py-10 px-6">
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
        className="flex flex-wrap gap-3 mb-10 bg-white/80 dark:bg-gray-900/70 p-6 rounded-2xl shadow-lg backdrop-blur-sm w-full max-w-3xl justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <input
          value={query.from}
          onChange={(e) => setQuery({ ...query, from: e.target.value })}
          placeholder="From (Station ID)"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none w-40"
        />
        <input
          value={query.to}
          onChange={(e) => setQuery({ ...query, to: e.target.value })}
          placeholder="To (Station ID)"
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none w-40"
        />
        <input
          type="date"
          value={query.date}
          onChange={(e) => setQuery({ ...query, date: e.target.value })}
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none w-40"
        />
        <select
          value={query.class_type}
          onChange={(e) => setQuery({ ...query, class_type: e.target.value })}
          className="p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none w-40"
        >
          <option value="SL">SL</option>
          <option value="3A">3A</option>
          <option value="2A">2A</option>
        </select>
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
            key={r.train_id + r.seat_id}
            className="p-4 bg-white/80 dark:bg-gray-900/70 rounded-xl shadow-xl flex justify-between items-center hover:scale-[1.03] transition-transform"
            whileHover={{ scale: 1.03 }}
          >
            <div>
              <strong className="text-lg">{r.train_name}</strong>
              <div className="text-gray-600 dark:text-gray-300">
                Class: {r.class_type} • Avl: {r.available_seats}
              </div>
              <div className="text-gray-500 dark:text-gray-400">Coach: {r.coach_no}</div>
            </div>
            <Link
              to={`/home/confirm/${encodeURIComponent(r.train_id)}`}
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg px-4 py-2 shadow-lg"
            >
              Book
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
