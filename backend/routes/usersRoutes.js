// routes/users.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');


// GET /profile - Fetch User Profile Data
router.get('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const [rows] = await pool.query('SELECT user_id, username, name, email, mobile_no, gender, age, dob, country, state, city, street FROM users WHERE user_id = ?', [userId]);
    
    // Ensure data exists before sending
    if (rows.length === 0) {
        return res.status(404).json({ message: 'User profile not found.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// 💾 NEW: PUT /profile - Update User Profile Data
router.put('/profile', auth, async (req, res) => {
  try {
    const userId = req.user.user_id;
    // Extract fields that can be updated from the request body
    const { 
        name, 
        email, 
        mobile_no, 
        gender, 
        age, 
        dob, 
        country, 
        state, 
        city, 
        street 
    } = req.body;

    // 1. Define the SQL update query and parameters
    const updateQuery = `
      UPDATE users 
      SET 
        name = ?, 
        email = ?, 
        mobile_no = ?, 
        gender = ?, 
        age = ?, 
        dob = ?, 
        country = ?, 
        state = ?, 
        city = ?, 
        street = ?
      WHERE user_id = ?
    `;

    const updateParams = [
        name, 
        email, 
        mobile_no, 
        gender, 
        age, 
        dob, 
        country, 
        state, 
        city, 
        street,
        userId // The WHERE condition comes last
    ];

    // 2. Execute the update query
    await pool.query(updateQuery, updateParams);

    // 3. Fetch the updated data to send back to the frontend (Best practice)
    const [rows] = await pool.query(
        'SELECT user_id, username, name, email, mobile_no, gender, age, dob, country, state, city, street FROM users WHERE user_id = ?', 
        [userId]
    );

    res.json(rows[0]); // Send the confirmed, updated user data back

  } catch (err) {
    console.error("Error updating profile:", err);
    // You might want to check for specific error codes (like unique email violation) here
    res.status(500).json({ message: 'Error updating profile' });
  }
});

module.exports = router;