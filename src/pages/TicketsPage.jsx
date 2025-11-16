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
      } catch (err) {
        setError("Unable to load ticket.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [ticketId]);

  // Generate PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("Railway E-Ticket", 20, 20);

    doc.setFontSize(13);
    doc.text(`Ticket ID: ${ticket.ticket_id}`, 20, 40);
    doc.text(`Passenger: ${ticket.passenger_name}`, 20, 55);
    doc.text(`Train: ${ticket.train_no} - ${ticket.train_name}`, 20, 70);
    doc.text(`Date: ${ticket.journey_date}`, 20, 85);
    doc.text(`From: ${ticket.source}`, 20, 100);
    doc.text(`To: ${ticket.destination}`, 20, 115);
    doc.text(`Coach: ${ticket.coach}`, 20, 130);
    doc.text(`Seat: ${ticket.seat_no}`, 20, 145);
    doc.text(`Status: ${ticket.status}`, 20, 160);
    doc.text(`Amount Paid: ₹${ticket.amount}`, 20, 175);

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
          <p><strong>Passenger:</strong> {ticket.passenger_name}</p>
          <p><strong>Train:</strong> {ticket.train_no} — {ticket.train_name}</p>
          <p><strong>Date:</strong> {ticket.journey_date}</p>
          <p><strong>From:</strong> {ticket.source}</p>
          <p><strong>To:</strong> {ticket.destination}</p>
          <p><strong>Coach:</strong> {ticket.coach}</p>
          <p><strong>Seat:</strong> {ticket.seat_no}</p>
          <p><strong>Status:</strong> {ticket.status}</p>
          <p><strong>Amount Paid:</strong> ₹{ticket.amount}</p>

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
