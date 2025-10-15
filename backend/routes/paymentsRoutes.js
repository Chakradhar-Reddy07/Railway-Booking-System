// routes/payments.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/payments/pay
 * body: { ticket_id, amount, mode }
 */
router.post('/pay', auth, async (req, res) => {
  try {
    const { ticket_id, amount, mode } = req.body;
    const paymentId = uuidv4();
    await pool.query('INSERT INTO payments (payment_id, ticket_id, amount, payment_date, status, mode) VALUES (?, ?, NOW(), ?, ?)', [paymentId, ticket_id, amount, 'SUCCESS', mode]);

    // update ticket status to CONFIRMED
    await pool.query('UPDATE tickets SET status = ? WHERE ticket_id = ?', ['CONFIRMED', ticket_id]);

    res.json({ payment_id: paymentId, status: 'SUCCESS' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Payment error' });
  }
});

module.exports = router;
