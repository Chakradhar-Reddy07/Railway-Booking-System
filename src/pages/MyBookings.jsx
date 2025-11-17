import React, { useEffect, useState } from 'react';
import { myBookings } from '../services/api';
import { motion } from 'framer-motion';

export default function MyBookings() {
  const [list, setList] = useState([]);
  const [list, setList] = useState([]);

  const loadBookings = async () => {
    try {
      const res = await myBookings();
      setList(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // -------------------------------------------
  // CANCEL API CALL
  // -------------------------------------------
  const handleCancel = async (ticketId) => {
    const confirmCancel = window.confirm("Are you sure you want to cancel this ticket?");
    if (!confirmCancel) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/bookings/cancel/${ticketId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Parse safely
      const raw = await res.text();
      console.log("RAW RESPONSE:", raw);

      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        console.error("❌ Backend returned HTML instead of JSON");
        alert("Server error. Check backend logs.");
        return;
      }

      if (!res.ok) {
        alert(data.message || "Error cancelling ticket");
        return;
      }

      alert("Ticket cancelled successfully!");
      loadBookings();
    } catch (err) {
      console.error("Cancel Error:", err);
      alert("Something went wrong while cancelling.");
    }
  };

  // Seat info formatting
  const renderSeatDetails = (p, t) => {
    if (p.seat_allocated) {
      const [coach_no, seat_no] = p.seat_allocated.split("-");
      return (
        <span className="text-green-600 dark:text-green-400 font-medium ml-auto">
          {coach_no} - {seat_no}
        </span>
      );
    }

    if (t.status === "PENDING") {
      return (
        <span className="text-orange-500 ml-auto text-sm">
          Waiting for Payment
        </span>
      );
    }

    return <span className="text-red-500 ml-auto">NOT ALLOCATED</span>;
  };

  return (
    <div className="page p-6 flex flex-col items-center">
      <motion.h2
        className="text-3xl font-bold mb-6 text-indigo-600 dark:text-indigo-400"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        My Bookings
      </motion.h2>
  return (
    <div className="page p-6 flex flex-col items-center">
      <motion.h2
        className="text-3xl font-bold mb-6 text-indigo-600 dark:text-indigo-400"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        My Bookings
      </motion.h2>

      <div className="grid gap-4 w-full max-w-3xl">
        {list.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-300">
            No bookings yet
          </div>
        ) : (
          list.map((t) => (
            <motion.div
              key={t.ticket_id}
              className="card p-6 bg-white/80 dark:bg-gray-900/70 rounded-xl shadow-xl hover:scale-[1.01] transform transition-all duration-300 border-l-4 border-indigo-500 space-y-3"
              whileHover={{ scale: 1.01 }}
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t.train_name}
                  {t.train_name}
                </h3>

                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    t.status === "CONFIRMED"
                      ? "bg-green-100 text-green-800"
                      : t.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {t.status}
                </span>
              </div>
              </div>

              {/* Journey Info */}
              <div className="text-sm text-gray-700 dark:text-gray-300 grid grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold">Booking Date:</span>{" "}
                  {t.booking_date}
                </div>
                <div>
                  <span className="font-semibold">Travel Date:</span>{" "}
                  {t.travel_date}
                </div>
                <div>
                  <span className="font-semibold">From:</span>{" "}
                  {t.boarding_station_name} ({t.boarding_station_id})
                </div>
                <div>
                  <span className="font-semibold">To:</span>{" "}
                  {t.departure_station_name} ({t.departure_station_id})
                </div>
                <div>
                  <span className="font-semibold">Class:</span> {t.class_type}
                </div>
                <div className="text-right text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  ₹{t.total_amount}
                  ₹{t.total_amount}
                </div>
              </div>
              </div>

              {/* Passengers */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold mb-2 text-md text-gray-800 dark:text-gray-200">
                  Passengers ({t.passengers?.length || 0})
                </h4>

                <div className="space-y-1">
                  {(t.passengers || []).map((p, index) => (
                    <div
                      key={index}
                      className="flex items-center text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="w-1/2">
                        {index + 1}. {p.name} ({p.age})
                      </span>

                      <span className="w-1/2 font-medium text-right flex justify-end items-center space-x-2">
                        <span className="text-gray-500 dark:text-gray-400">
                          Seat:
                        </span>
                        {renderSeatDetails(p, t)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cancel Button */}
              {t.status !== "CANCELLED" && (
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => handleCancel(t.ticket_id)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition-all"
                  >
                    Cancel Ticket
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
