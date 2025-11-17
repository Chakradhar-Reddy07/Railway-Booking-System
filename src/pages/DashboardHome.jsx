import React from "react";
import "./Home.css";   // your animations, gradients etc.

export default function DashboardHome() {
  return (
    <div className="dashboard-home">

      {/* Hero Section */}
      <header className="hero-section fade-in">
        <h1 className="hero-title">Railway Booking Portal</h1>
        <p className="hero-subtitle">
          Your fast, secure and smart train ticket booking experience.
        </p>
      </header>

      {/* Features */}
      <section className="feature-section fade-in-up">
        <h2 className="section-title">Explore Our Features</h2>

        <div className="feature-grid">
          {[
            { icon: "🏠", title: "Home", desc: "Live updates & user dashboard." },
            { icon: "🚆", title: "Available Trains", desc: "Search trains, timings & seats." },
            { icon: "📄", title: "My Bookings", desc: "Manage bookings & ticket history." },
            { icon: "👤", title: "Profile", desc: "Update your personal details." },
            { icon: "💳", title: "Payments", desc: "Secure & fast payment support." },
            { icon: "❓", title: "Help", desc: "FAQs, refund rules & customer support." }
          ].map((item, i) => (
            <div key={i} className="feature-card float-card">
              <div className="feature-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Official Railway References */}
      <section className="reference-section fade-in-up">
        <h2 className="section-title">Official Railway Resources</h2>

        <div className="ref-grid">
          <a href="https://enquiry.indianrail.gov.in/" target="_blank" className="ref-card">
            <svg width="40" viewBox="0 0 24 24">
              <path d="M12 2L3 6v6c0 5 3.5 10 9 11 5-1 9-6 9-11V6l-9-4z"
                    stroke="#0077ff" strokeWidth="2" fill="none"/>
            </svg>
            <span>Indian Railways Enquiry</span>
          </a>

          <a href="https://www.irctc.co.in/" target="_blank" className="ref-card">
            <svg width="40" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" stroke="#0a991c" strokeWidth="2" fill="none"/>
              <path d="M12 7v5l3 2" stroke="#0a991c" strokeWidth="2"/>
            </svg>
            <span>IRCTC Official</span>
          </a>

          <a href="https://indianrailways.gov.in/" target="_blank" className="ref-card">
            <svg width="40" viewBox="0 0 24 24">
              <rect x="4" y="4" width="16" height="14"
                    stroke="#aa00ff" strokeWidth="2" fill="none"/>
              <path d="M4 10h16" stroke="#aa00ff" strokeWidth="2"/>
            </svg>
            <span>Ministry of Railways</span>
          </a>
        </div>
      </section>

    </div>
  );
}