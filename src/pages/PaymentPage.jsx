import React, { useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { pay } from '../services/api';
import { motion } from 'framer-motion';

export default function PaymentPage() {
  const { ticketId } = useParams();
  const location = useLocation();
  const nav = useNavigate();
  const [mode, setMode] = useState('CARD');
  const [amount] = useState(location.state?.amount || 0);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await pay({ ticket_id: ticketId, amount, mode });
      alert('Payment successful');
      nav('/mybookings');
    } catch (err) {
      console.error(err);
      alert('Payment failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="page flex justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-white/90 dark:bg-gray-900/70 p-6 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Payment</h2>
        <div className="mb-4 text-gray-700 dark:text-gray-300">Ticket ID: {ticketId}</div>
        <div className="mb-6 text-lg font-semibold">Amount: ₹ {amount}</div>

        <form onSubmit={submit} className="space-y-4">
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Payment Mode</label>
            <select value={mode} onChange={e => setMode(e.target.value)} className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="CARD">Card</option>
              <option value="UPI">UPI</option>
              <option value="NETBANKING">Netbanking</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg">
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
