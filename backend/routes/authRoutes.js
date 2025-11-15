const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

//  Signup route
router.post('/signup', async (req, res) => {
  try {
    const { username, password, name, email, mobile_no } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

    const [exists] = await pool.query('SELECT 1 FROM users WHERE username = ?', [username]);
    if (exists.length) return res.status(400).json({ message: 'Username already taken' });
    console.log("🎯 SIGNUP BODY:", req.body); 

    const hash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    await pool.query(
      `INSERT INTO users (user_id, username, name, password_hash, email, mobile_no)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, username, name || '', hash, email || '', mobile_no || '']
    );

    const token = jwt.sign({ user_id: userId, username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { user_id: userId, username, name, email, mobile_no } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Signup failed' });
  }
});

//  Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

    const [rows] = await pool.query(
      'SELECT user_id, username, password_hash, name, email, mobile_no FROM users WHERE username = ?',
      [username]
    );

    if (!rows.length) return res.status(401).json({ message: 'Invalid username or password' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid username or password' });

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        name: user.name,
        email: user.email,
        mobile_no: user.mobile_no,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});


module.exports = router;
