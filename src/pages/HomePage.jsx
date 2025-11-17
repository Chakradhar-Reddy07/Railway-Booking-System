import React from "react";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

export default function HomePage({ setTheme, theme }) {
  return (
    <div className="layout-container">
      <Navbar setTheme={setTheme} theme={theme} />

      {/* All nested pages render here */}
      <div style={{ padding: 0 }}>
        <Outlet />
      </div>
    </div>
  );
}