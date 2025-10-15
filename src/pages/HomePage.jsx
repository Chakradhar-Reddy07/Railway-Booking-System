import React from 'react';
import Navbar from '../components/Navbar';
import { Outlet } from 'react-router-dom';

export default function Home({ setTheme, theme }) {
  return (
    <div>
      <Navbar setTheme={setTheme} theme={theme} />
      <div style={{padding:20}}>
        <Outlet/>
      </div>
    </div>
  );
}
