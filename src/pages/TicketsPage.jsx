import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTicket } from "../services/api";
import jsPDF from "jspdf";

export default function TicketPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch ticket from backend
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getTicket(ticketId);
        setTicket(data);
        console.log("TICKET DATA:", data);
      } catch (err) {
        setError("Unable to load ticket.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [ticketId]);
  const renderSeatDetails = (p) => {
    if (p.seat_allocated) {
      const [coach_no, seat_no] = p.seat_allocated.split("-");
      return (
        <span className="text-green-600 dark:text-green-400 font-medium ml-auto">
          {coach_no} - {seat_no}
        </span>
      );
    }
  };
  // Generate PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Railway E-Ticket", 20, 20);

    doc.setFontSize(13);
    doc.text(`Ticket ID: ${ticket.ticket_id}`, 20, 40);
    doc.text(`Train: ${ticket.train_id} - ${ticket.train_name}`, 20, 70);
    doc.text(`Date: ${ticket.travel_date}`, 20, 85);
    doc.text(`From: ${ticket.boarding_station}`, 20, 100);
    doc.text(`To: ${ticket.departure_station}`, 20, 115);
    // Passengers
    doc.text("Passengers:", 20, 130);
    ticket.passengers.forEach((p, index) => {
      const yPos = 140 + index * 10;
      doc.text(`${index + 1}. ${p.name} (${p.age}) - Seat: ${p.seat_allocated || 'N/A'}`, 25, yPos);
    });
    doc.text(`Status: ${ticket.status}`, 20, 160);
    doc.text(`Amount Paid: ₹${ticket.total_amount}`, 20, 175);

    doc.save(`Ticket_${ticket.ticket_id}.pdf`);
  };

  if (loading) {
    return (
      <div className="text-center mt-20 text-xl font-semibold">
        Loading ticket…
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="text-center mt-20 text-red-500 text-xl">
        {error || "Ticket not found."}
      </div>
    );
  }

  return (
    <div className="flex justify-center mt-16 px-4">
      <div className="w-full max-w-lg p-6 bg-white dark:bg-gray-800 shadow-xl rounded-xl border dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-center dark:text-white">
          E-Ticket
        </h2>

        <div className="space-y-3 text-gray-800 dark:text-gray-200">

          <p><strong>Train:</strong> {ticket.train_id} — {ticket.train_name}</p>
          <p><strong>Date:</strong> {ticket.travel_date}</p>
          <p><strong>From:</strong> {ticket.boarding_station}</p>
          <p><strong>To:</strong> {ticket.departure_station}</p>
            {/* Passengers */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold mb-2 text-md text-gray-800 dark:text-gray-200">
                  Passengers ({ticket.passengers?.length || 0})
                </h4>

                <div className="space-y-1">
                  {(ticket.passengers || []).map((p, index) => (
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
                        {renderSeatDetails(p)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
          <p><strong>Status:</strong> {ticket.status}</p>
          <p><strong>Amount Paid:</strong> ₹{ticket.total_amount}</p>

          {ticket.payment_id && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="font-semibold">Payment Details</p>
              <p><strong>Payment ID:</strong> {ticket.payment_id}</p>
              <p><strong>Mode:</strong> {ticket.mode}</p>
              <p><strong>Date:</strong> {ticket.payment_date}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => navigate("/home")}
            className="px-4 py-2 rounded-lg bg-gray-400 hover:bg-gray-500 text-white"
          >
            Back to Home
          </button>

          <button
            onClick={downloadPDF}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            Download Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
