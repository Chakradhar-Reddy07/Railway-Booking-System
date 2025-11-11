const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Available trains with seat filter
// ✅ GET Available Trains between two stations on selected date (train start date)
router.get('/available', async (req, res) => {
  try {
    const { from, to, date } = req.query;
    if (!from || !to || !date)
      return res.status(400).json({ message: 'from, to, and date are required' });

    // Convert date to weekday (for route_stations)
    const days = ['sun','mon','tue','wed','thu','fri','sat'];
    const weekday = days[new Date(date).getDay()];

    const sql =  `
      SELECT 
          t.train_id,
          t.train_name,
          si.class_type,
          rs_from.departure_time AS from_departure,
          rs_to.arrival_time AS to_arrival,
          COUNT(CASE WHEN ss.availability_status = 'AVAILABLE' THEN 1 END) AS available_seats,
          COUNT(ss.seat_no) AS total_seats
      FROM trains t
      JOIN route_stations rs_from 
          ON rs_from.train_id = t.train_id
      JOIN route_stations rs_to 
          ON rs_to.train_id = t.train_id
      JOIN seat_inventory si 
          ON si.train_id = t.train_id
      LEFT JOIN seat_status ss 
          ON ss.train_id = t.train_id
          AND ss.class_type = si.class_type
          AND ss.coach_no = si.coach_no
          AND ss.from_seq_no < rs_to.seq_no
          AND ss.to_seq_no > rs_from.seq_no
          AND ss.travel_date = (
              SELECT MIN(travel_date)
              FROM seat_status
              WHERE train_id = t.train_id
                AND travel_date <= ?
          )
      WHERE 
          rs_from.station_id = ?
          AND rs_to.station_id = ?
          AND rs_from.seq_no < rs_to.seq_no
          AND (rs_from.${weekday} = 1 OR rs_to.${weekday} = 1)
      GROUP BY 
          t.train_id, t.train_name, si.class_type, rs_from.departure_time, rs_to.arrival_time
      ORDER BY 
          t.train_name;
    `;
    const [rows] = await pool.query(sql, [date, from, to]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching available trains:', err);
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
