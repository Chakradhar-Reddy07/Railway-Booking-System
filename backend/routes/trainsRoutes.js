const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Available trains with seat filter
router.get('/available', async (req, res) => {
  try {
    const { from, to, class_type } = req.query;
 console.log('Query params:', from, to, class_type);
    const sql = `
      SELECT DISTINCT t.train_id, t.train_name, rs_from.seq_no as from_seq, rs_to.seq_no as to_seq,
             si.seat_id, si.class_type, si.available_seats, si.coach_no, si.total_seats
      FROM trains t
      JOIN route_stations rs_from ON rs_from.train_id = t.train_id
      JOIN route_stations rs_to ON rs_to.train_id = t.train_id
      LEFT JOIN seat_inventory si 
        ON si.train_id = t.train_id AND si.class_type = ?
      WHERE rs_from.station_id = ? AND rs_to.station_id = ? AND rs_from.seq_no < rs_to.seq_no
        AND si.available_seats > 0
    `;

    const [rows] = await pool.query(sql, [class_type, from, to]);
     console.log('Result rows:', rows);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching available trains' });
  }
});

// Train details
router.get('/:id', async (req, res) => {
  try {
    const trainId = req.params.id;
    const [trainRows] = await pool.query('SELECT * FROM trains WHERE train_id = ?', [trainId]);
    if (!trainRows.length) return res.status(404).json({ message: 'Train not found' });

    const [routeRows] = await pool.query('SELECT rs.*, s.station_name, s.city FROM route_stations rs JOIN stations s ON s.station_id = rs.station_id WHERE rs.train_id = ? ORDER BY rs.seq_no', [trainId]);

    res.json({ train: trainRows[0], route: routeRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching train details' });
  }
});

module.exports = router;
