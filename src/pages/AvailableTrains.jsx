import React, { useState } from 'react';
import { getAvailableTrains } from '../services/api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
//import Background3D from '../components/Background3D'; // ⬅️ adjust path as needed

export default function AvailableTrains() {
  const [query, setQuery] = useState({
    from: 'S_BHP',
    to: 'S_HYD',
    date: '2025-11-01'
  });

  const [results, setResults] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search(e) {
    e?.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const res = await getAvailableTrains(query);

      // GROUP BY TRAIN_ID
      const g = {};
      res.forEach((item) => {
        if (!g[item.train_id]) {
          g[item.train_id] = {
            train_id: item.train_id,
            train_name: item.train_name,
            from_departure: item.from_departure,
            to_arrival: item.to_arrival,
            classes: []
          };
        }
        g[item.train_id].classes.push({
          class_type: item.class_type,
          available_seats: item.available_seats
        });
      });

      setResults(res);
      setGrouped(g);
    } catch (err) {
      console.error(err);
      setResults([]);
      setGrouped({});
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center py-10 px-6 overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
         {/* <Background3D /> */}
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">

        {/* TITLE */}
        <motion.h2
          className="text-4xl font-extrabold mb-10 text-indigo-600 dark:text-indigo-400 drop-shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Search Trains
        </motion.h2>

        {/* SEARCH FORM */}
        <motion.form
          onSubmit={search}
          className="flex flex-wrap gap-4 mb-12 bg-white/60 dark:bg-gray-800/60 p-8 rounded-3xl 
          shadow-2xl backdrop-blur-xl w-full max-w-4xl justify-center 
          border border-white/40 dark:border-gray-700/40"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <input
            value={query.from}
            onChange={(e) => setQuery({ ...query, from: e.target.value })}
            placeholder="From"
            className="p-3 rounded-xl border border-gray-300 dark:border-gray-600 
            bg-white/90 dark:bg-gray-700/80 focus:ring-2 w-44"
          />

          <input
            value={query.to}
            onChange={(e) => setQuery({ ...query, to: e.target.value })}
            placeholder="To"
            className="p-3 rounded-xl border border-gray-300 dark:border-gray-600 
            bg-white/90 dark:bg-gray-700/80 focus:ring-2 w-44"
          />

          <input
            type="date"
            value={query.date}
            onChange={(e) => setQuery({ ...query, date: e.target.value })}
            className="p-3 rounded-xl border border-gray-300 dark:border-gray-600 
            bg-white/90 dark:bg-gray-700/80 focus:ring-2 w-44"
          />

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 
            text-white font-semibold shadow-lg transition-all"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </motion.form>

        {/* RESULTS */}
        <div className="w-full max-w-4xl space-y-6">
          {loading && (
            <div className="text-center text-xl text-indigo-500">Loading...</div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="text-center text-gray-600 dark:text-gray-300 text-lg">
              No trains found
            </div>
          )}

          {/* GROUPED TRAIN CARDS */}
          {Object.values(grouped).map((train) => (
            <motion.div
              key={train.train_id}
              className="p-6 bg-white/80 dark:bg-gray-900/70 rounded-3xl shadow-2xl 
              backdrop-blur-xl border border-white/40 dark:border-gray-700/50 
              hover:shadow-3xl transition hover:-translate-y-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Train Header */}
              <div className="flex justify-between items-center flex-wrap">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {train.train_name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {train.from_departure} → {train.to_arrival}
                  </p>
                </div>
              </div>

              {/* Classes List */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {train.classes.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-4 rounded-2xl 
                    bg-gray-100/80 dark:bg-gray-800/60 border border-gray-300/50 
                    dark:border-gray-700/40 shadow"
                  >
                    <div>
                      <p className="text-lg font-semibold">
                        {c.class_type}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Available: {c.available_seats}
                      </p>
                    </div>

                    <Link
                      to={`/home/confirm/${train.train_id}?from=${query.from}&to=${query.to}&date=${query.date}&class=${c.class_type}`}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 
                      rounded-xl text-white font-semibold shadow"
                    >
                      Book
                    </Link>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
