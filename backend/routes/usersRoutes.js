// routes/users.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');


router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const [rows] = await pool.query('SELECT user_id, username, name, email, mobile_no, gender, age, dob, country, state, city, street FROM users WHERE user_id = ?', [userId]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

module.exports = router;
