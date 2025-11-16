import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Background3D from './components/Background3D';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPassword from './pages/ForgotPassword';
import HomePage from './pages/HomePage';
import AvailableTrains from './pages/AvailableTrains';
import ConfirmationPage from './pages/ConfirmationPage';
import PaymentPage from './pages/PaymentPage';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';

function AnimatedRoutes({ setTheme, theme }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot" element={<ForgotPassword />} />
        <Route path="/home" element={<HomePage setTheme={setTheme} theme={theme}/>}>
          <Route path="trains" element={<AvailableTrains />} />
         <Route path="confirm/:id" element={<ConfirmationPage />} />
          <Route path="payment/:ticketId" element={<PaymentPage />} />
          <Route path="mybookings" element={<MyBookings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  return (
    <BrowserRouter>
      <div className="relative min-h-screen w-full">
        <Background3D />
        <div className="relative z-10">
          <AnimatedRoutes setTheme={setTheme} theme={theme} />
        </div>
      </div>
    </BrowserRouter>
  );
}

console.log("APP LOADED");
