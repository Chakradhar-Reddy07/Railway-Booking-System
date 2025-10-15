import React from 'react';
import { motion } from 'framer-motion';

export default function ForgotPassword() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 dark:bg-gray-900/80 backdrop-blur-lg p-8 rounded-xl shadow-2xl w-full max-w-md text-center"
      >
        <h2 className="text-3xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Forgot Password</h2>
        <p className="text-gray-700 dark:text-gray-300">
          Implement reset-by-email flow here (or contact admin). This is a placeholder page.
        </p>
      </motion.div>
    </div>
  );
}
