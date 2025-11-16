const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/tickets/:ticket_id
router.get('/:ticket_id', auth, async (req, res) => {
  try {
    const ticketId = req.params.ticket_id;

    const [rows] = await pool.query(
      `
      SELECT 
          t.ticket_id,
          t.user_id,
          t.train_id,
          tr.train_name,
          t.booking_date,
          t.travel_date,
          t.num_of_passengers,
          t.class_type,
          t.status,
          t.total_amount,
          
          bs.station_name AS boarding_station,
          ds.station_name AS departure_station,

          p.payment_id,
          p.payment_date,
          p.mode

      FROM tickets t

      LEFT JOIN trains tr ON tr.train_id = t.train_id
      LEFT JOIN stations bs ON bs.station_id = t.boarding_station_id
      LEFT JOIN stations ds ON ds.station_id = t.departure_station_id
      LEFT JOIN payments p ON p.ticket_id = t.ticket_id

      WHERE t.ticket_id = ?
      `,
      [ticketId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Security: Only owner can view ticket
    if (rows[0].user_id !== req.user.user_id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("TICKET FETCH ERROR:", err);
    res.status(500).json({ message: "Error fetching ticket", error: err });
  }
});

module.exports = router;

