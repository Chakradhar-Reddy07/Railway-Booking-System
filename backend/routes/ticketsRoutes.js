const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET /api/tickets/:ticket_id
router.get('/:ticket_id', auth, async (req, res) => {
  try {
    const ticketId = req.params.ticket_id;

    const [rows] = await pool.query(
      `SELECT 
        t.ticket_id,
        t.user_id,
        t.passenger_name,
        t.train_no,
        t.train_name,
        t.journey_date,
        t.source,
        t.destination,
        t.coach,
        t.seat_no,
        t.status,
        t.amount,
        p.payment_id,
        p.payment_date,
        p.mode
      FROM tickets t
      LEFT JOIN payments p ON p.ticket_id = t.ticket_id
      WHERE t.ticket_id = ?`,
      [ticketId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Security: ensure user can ONLY view their own ticket
    if (rows[0].user_id !== req.user.user_id) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("TICKET FETCH ERROR:", err);
    return res.status(500).json({
      message: 'Error fetching ticket',
      sqlMessage: err.sqlMessage,
      sql: err.sql,
      code: err.code
    });
  }
});

module.exports = router;

