// routes/bookingsRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const { v4: uuidv4 } = require("uuid");

// -----------------------------------------------------
// CREATE BOOKING
// -----------------------------------------------------
router.post("/create", auth, async (req, res) => {
  let connection;
  try {
    const {
      train_id,
      travel_date,
      class_type,
      num_of_passengers,
      boarding_station_id,
      departure_station_id,
      passengers,
      quota = "GENERAL"     // DEFAULT QUOTA
    } = req.body;

    const userId = req.user.user_id;
    const ticketId = uuidv4();

    // 1. Fetch seq no & distance
    const [boardingRow] = await pool.query(
      `SELECT distance_from_source, seq_no 
       FROM route_stations 
       WHERE station_id = ? AND train_id = ? LIMIT 1`,
      [boarding_station_id, train_id]
    );
    const [departureRow] = await pool.query(
      `SELECT distance_from_source, seq_no 
       FROM route_stations 
       WHERE station_id = ? AND train_id = ? LIMIT 1`,
      [departure_station_id, train_id]
    );

    if (!boardingRow[0] || !departureRow[0]) {
      return res.status(400).json({ message: "Invalid station IDs." });
    }

    const boardingSeq = boardingRow[0].seq_no;
    const departureSeq = departureRow[0].seq_no;
    const dist =
      departureRow[0].distance_from_source -
      boardingRow[0].distance_from_source;

    if (dist <= 0 || boardingSeq >= departureSeq) {
      return res.status(400).json({ message: "Invalid route order." });
    }

    // 2. Fare
    const [fareRows] = await pool.query(
      `SELECT base_fare_per_km FROM seat_inventory 
       WHERE train_id = ? AND class_type = ? LIMIT 1`,
      [train_id, class_type]
    );
    const baseFare = fareRows[0]?.base_fare_per_km || 1.2;
    const total_amount = dist * baseFare * num_of_passengers;

    // 3. Start Transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 4. Insert ticket
    await connection.query(
      `INSERT INTO tickets 
      (ticket_id, user_id, train_id, booking_date, travel_date,
       num_of_passengers, class_type, status,
       boarding_station_id, departure_station_id,
       total_amount)
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

    // 5. Handle seat allocation + segment splitting
    const newAvailableSegments = [];

    for (const p of passengers) {
      // Insert passenger
      await connection.query(
        `INSERT INTO passengers 
         (ticket_id, name, age, class_type, seat_allocated)
         VALUES (?, ?, ?, ?, ?)`,
        [
          ticketId,
          p.name,
          p.age || null,
          class_type,
          p.seat_no && p.coach_no ? `${p.coach_no}-${p.seat_no}` : null,
        ]
      );

      if (p.seat_no && p.coach_no) {
        // The AVAILABLE segment to split
        const [availableSegment] = await connection.query(
          `SELECT * FROM seat_status
           WHERE train_id = ?
             AND class_type = ?
             AND travel_date = ?
             AND coach_no = ?
             AND seat_no = ?
             AND quota = ?
             AND availability_status = 'AVAILABLE'
             AND from_seq_no < ?
             AND to_seq_no > ?
           LIMIT 1`,
          [
            train_id,
            class_type,
            travel_date,
            p.coach_no,
            p.seat_no,
            quota,
            departureSeq,
            boardingSeq,
          ]
        );

        const existingSegment = availableSegment[0];

        if (existingSegment) {
          // Delete old segment
          await connection.query(
            `DELETE FROM seat_status WHERE id = ?`,
            [existingSegment.id]
          );

          // Insert BOOKED segment   <-- FIX: added quota
          await connection.query(
            `INSERT INTO seat_status 
            (train_id, class_type, coach_no, seat_no,
             from_seq_no, to_seq_no, availability_status, travel_date, quota)
             VALUES (?, ?, ?, ?, ?, ?, 'BOOKED', ?, ?)`,
            [
              train_id,
              class_type,
              p.coach_no,
              p.seat_no,
              boardingSeq,
              departureSeq,
              travel_date,
              quota,
            ]
          );

          // Insert left available part (if any)
          if (existingSegment.from_seq_no < boardingSeq) {
            newAvailableSegments.push([
              train_id,
              class_type,
              p.coach_no,
              p.seat_no,
              existingSegment.from_seq_no,
              boardingSeq,
              "AVAILABLE",
              travel_date,
              quota,
            ]);
          }

          // Insert right available part (if any)
          if (existingSegment.to_seq_no > departureSeq) {
            newAvailableSegments.push([
              train_id,
              class_type,
              p.coach_no,
              p.seat_no,
              departureSeq,
              existingSegment.to_seq_no,
              "AVAILABLE",
              travel_date,
              quota,
            ]);
          }
        }
      }
    }

    // 6. BULK INSERT AVAILABLE SEGMENTS (now with quota!!)
    if (newAvailableSegments.length > 0) {
      const placeholders = newAvailableSegments
        .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .join(", ");

      await connection.query(
        `INSERT INTO seat_status 
        (train_id, class_type, coach_no, seat_no,
         from_seq_no, to_seq_no, availability_status, travel_date, quota)
         VALUES ${placeholders}`,
        newAvailableSegments.flat()
      );
    }

    // 7. Commit
    await connection.commit();
    connection.release();

    res.json({
      message: "Booking created successfully",
      ticket_id: ticketId,
      total_amount,
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("❌ Booking creation error:", err);
    res.status(500).json({ message: "Booking creation error" });
  }
});

// -----------------------------------------------------
// GET BOOKINGS
// -----------------------------------------------------
router.get("/my", auth, async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [tickets] = await pool.query(
      `SELECT 
        t.ticket_id, t.train_id,
        IFNULL(tr.train_name,'Unknown Train') AS train_name,
        t.travel_date, t.booking_date,
        t.class_type, t.status, t.total_amount,
        t.boarding_station_id,
        IFNULL(s_b.station_name,t.boarding_station_id) AS boarding_station_name,
        t.departure_station_id,
        IFNULL(s_d.station_name,t.departure_station_id) AS departure_station_name
       FROM tickets t
       LEFT JOIN trains tr ON t.train_id = tr.train_id
       LEFT JOIN stations s_b ON t.boarding_station_id = s_b.station_id
       LEFT JOIN stations s_d ON t.departure_station_id = s_d.station_id
       WHERE t.user_id = ?
       ORDER BY t.booking_date DESC`,
      [userId]
    );

    const ticketIds = tickets.map((t) => t.ticket_id);

    if (ticketIds.length === 0) return res.json([]);

    const placeholders = ticketIds.map(() => "?").join(",");
    const [passengers] = await pool.query(
      `SELECT ticket_id, name, age, class_type, seat_allocated
       FROM passengers
       WHERE ticket_id IN (${placeholders})
       ORDER BY name`,
      ticketIds
    );

    const data = tickets.map((t) => ({
      ...t,
      booking_date: t.booking_date ? t.booking_date.toISOString().split("T")[0] : "",
      travel_date: t.travel_date ? t.travel_date.toISOString().split("T")[0] : "",
      passengers: passengers.filter((p) => p.ticket_id === t.ticket_id),
    }));

    res.json(data);
  } catch (err) {
    console.error("❌ My Bookings Error:", err);
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

// -----------------------------------------------------
// CANCEL TICKET (Trigger handles merging)
// -----------------------------------------------------
router.patch("/cancel/:ticketId", auth, async (req, res) => {
  const ticketId = req.params.ticketId;
  const userId = req.user.user_id;

  try {
    const [ticketRows] = await pool.query(
      `SELECT ticket_id, status, user_id 
       FROM tickets WHERE ticket_id = ? LIMIT 1`,
      [ticketId]
    );

    if (ticketRows.length === 0)
      return res.status(404).json({ message: "Ticket not found." });

    const ticket = ticketRows[0];

    if (ticket.user_id !== userId)
      return res.status(403).json({ message: "Not allowed." });

    if (ticket.status === "CANCELLED")
      return res.status(400).json({ message: "Already cancelled." });

    await pool.query(
      `UPDATE tickets SET status='CANCELLED' WHERE ticket_id=?`,
      [ticketId]
    );

    res.json({
      message: "Ticket cancelled successfully.",
      detail: "Seat availability restored (via trigger).",
    });
  } catch (err) {
    console.error("❌ Cancel Ticket Error:", err);
    res.status(500).json({ message: "Error cancelling ticket." });
  }
});

module.exports = router;
