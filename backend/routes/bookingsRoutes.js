// routes/bookingsRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const { v4: uuidv4 } = require("uuid");


router.post("/create", auth, async (req, res) => {
  try {
    const {
      train_id,
      travel_date,
      class_type,
      num_of_passengers,
      boarding_station_id,
      departure_station_id,
      passengers,
    } = req.body;
console.log("User:", req.user);
console.log("Payload:", req.body);

    const userId = req.user.user_id;

    const ticketId = uuidv4();

    //  Get distance values
    const [boardingRow] = await pool.query(
      `SELECT distance_from_source FROM route_stations 
       WHERE station_id = ? AND train_id = ? LIMIT 1`,
      [boarding_station_id, train_id]
    );
    const [departureRow] = await pool.query(
      `SELECT distance_from_source FROM route_stations 
       WHERE station_id = ? AND train_id = ? LIMIT 1`,
      [departure_station_id, train_id]
    );

    const dist =
      (departureRow[0]?.distance_from_source || 0) -
      (boardingRow[0]?.distance_from_source || 0);
    if (dist <= 0)
      return res
        .status(400)
        .json({ message: "Invalid route (boarding must be before departure)" });

    //  Fetch base fare for the class type
    const [fareRows] = await pool.query(
      `SELECT base_fare_per_km FROM seat_inventory 
       WHERE train_id = ? AND class_type = ? LIMIT 1`,
      [train_id, class_type]
    );
    const baseFare = fareRows[0]?.base_fare_per_km || 1.2;
    const total_amount = dist * baseFare * num_of_passengers;

    //  Insert into tickets table
    await pool.query(
      `INSERT INTO tickets 
      (ticket_id, user_id, train_id, booking_date, travel_date, 
       num_of_passengers, class_type, status, boarding_station_id, 
       departure_station_id, total_amount)
      VALUES (?, ?, ?, CURDATE(), ?, ?, ?, 'PENDING', ?, ?, ?)`,
      [
        ticketId,
        userId,
        train_id,
        travel_date,
        num_of_passengers,
        class_type,
        boarding_station_id,
        departure_station_id,
        total_amount,
      ]
    );

    //  Insert each passenger
    if (Array.isArray(passengers)) {
      for (const p of passengers) {
        await pool.query(
          `INSERT INTO passengers 
           (ticket_id, name, age, berth_preference) 
           VALUES (?, ?, ?, ?)`,
          [ticketId, p.name, p.age || null, p.berth_preference || null]
        );
      }
    }

    res.json({
      message: "Booking created successfully",
      ticket_id: ticketId,
      total_amount,
    });
  } catch (err) {
    console.error("❌ Booking creation error:", err);
    res.status(500).json({ message: "Booking creation error" });
  }
});


router.get("/my", auth, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const [rows] = await pool.query(
      `SELECT * FROM tickets WHERE user_id = ? ORDER BY booking_date DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching user bookings:", err);
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

module.exports = router;
