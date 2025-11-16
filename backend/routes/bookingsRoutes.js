// routes/bookingsRoutes.js
// routes/bookingsRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const auth = require("../middleware/auth");
const { v4: uuidv4 } = require("uuid");

// Helper function to fetch sequence numbers and distance
async function getSeqNumbers(pool, train_id, boarding_id, departure_id) {
    const [boardingRow] = await pool.query(
        `SELECT seq_no, distance_from_source FROM route_stations 
         WHERE station_id = ? AND train_id = ? LIMIT 1`,
        [boarding_id, train_id]
    );
    const [departureRow] = await pool.query(
        `SELECT seq_no, distance_from_source FROM route_stations 
         WHERE station_id = ? AND train_id = ? LIMIT 1`,
        [departure_id, train_id]
    );

    if (!boardingRow.length || !departureRow.length) {
        throw new Error('Invalid station IDs for the given train.');
    }
    
    return {
        boarding_seq: boardingRow[0].seq_no,
        departure_seq: departureRow[0].seq_no,
        distance: departureRow[0].distance_from_source - boardingRow[0].distance_from_source,
    };
}


router.post("/create", auth, async (req, res) => {
    let connection;
    try {
        const {
            train_id,
            travel_date,
            class_type,
            boarding_station_id,
            departure_station_id,
            passengers, // passengers now includes { name, age, coach_no, seat_no }
        } = req.body;

        if (!passengers || passengers.length === 0 || !passengers.every(p => p.seat_no && p.coach_no)) {
             return res.status(400).json({ message: "Please select a seat for all passengers." });
        }

        const userId = req.user.user_id;
        const ticketId = uuidv4();
        const num_of_passengers = passengers.length;

        // 1. Get sequence numbers, distance, and base fare
        const { boarding_seq, departure_seq, distance } = await getSeqNumbers(
            pool, train_id, boarding_station_id, departure_station_id
        );
        
        const [fareRow] = await pool.query(
            `SELECT base_fare_per_km FROM seat_inventory 
             WHERE train_id = ? AND class_type = ? LIMIT 1`,
            [train_id, class_type]
        );
        const baseFarePerKm = fareRow[0]?.base_fare_per_km || 0;
        const totalAmount = Math.round(baseFarePerKm * distance * num_of_passengers);

        // 2. Start Transaction
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 3. Insert Ticket
        await connection.query(
            `INSERT INTO tickets 
             (ticket_id, user_id, train_id, booking_date, travel_date, 
              num_of_passengers, class_type, status, boarding_station_id, 
              departure_station_id, total_amount)
             VALUES (?, ?, ?, CURDATE(), ?, ?, ?, 'PENDING', ?, ?, ?)`
            , [
                ticketId, userId, train_id, travel_date, num_of_passengers,
                class_type, boarding_station_id, departure_station_id, totalAmount
            ]
        );

        // 4. Process each passenger and update seat_status (Segment Splitting)
        for (const p of passengers) {
            const { name, age, coach_no, seat_no } = p;
            
            // a. Insert Passenger
            await connection.query(
                `INSERT INTO passengers 
                 (ticket_id, name, age, seat_allocated) 
                 VALUES (?, ?, ?, ?)`
                , [ticketId, name, age || null, `${coach_no}-${seat_no}`]
            );

            // b. Find ALL segments for this seat/coach/date.
            // SegmentsToSplit are AVAILABLE segments that overlap with the booking.
            const [segmentsToSplit] = await connection.query(
                `SELECT id, from_seq_no, to_seq_no
                 FROM seat_status 
                 WHERE train_id = ? AND class_type = ? AND coach_no = ? AND seat_no = ? AND travel_date = ?
                   AND availability_status = 'AVAILABLE'
                   AND from_seq_no < ? AND to_seq_no > ? 
                 ORDER BY from_seq_no`
                , [train_id, class_type, coach_no, seat_no, travel_date, departure_seq, boarding_seq]
            );

            if (segmentsToSplit.length === 0) {
                 // Concurrency check: seat became unavailable between frontend fetch and booking.
                 await connection.rollback();
                 throw new Error(`Seat ${seat_no} in ${coach_no} is no longer available for the selected route. Please try again.`);
            }
            
            // --- Crucial Segment Splitting ---
            for (const seg of segmentsToSplit) {
                const old_from = seg.from_seq_no;
                const old_to = seg.to_seq_no;

                // 1. Delete the old AVAILABLE segment
                await connection.query('DELETE FROM seat_status WHERE id = ?', [seg.id]);

                // 2. Insert the new BOOKED segment (user's journey segment)
                await connection.query(
                    `INSERT INTO seat_status (train_id, class_type, coach_no, seat_no, from_seq_no, to_seq_no, availability_status, travel_date, quota)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [train_id, class_type, coach_no, seat_no, boarding_seq, departure_seq, 'BOOKED', travel_date, 'GENERAL']
                );

                // 3. Insert AVAILABLE segment BEFORE the booking (if one exists)
                if (old_from < boarding_seq) {
                    await connection.query(
                        `INSERT INTO seat_status (train_id, class_type, coach_no, seat_no, from_seq_no, to_seq_no, availability_status, travel_date)
                         VALUES (?, ?, ?, ?, ?, ?, 'AVAILABLE', ?)`,
                        [train_id, class_type, coach_no, seat_no, old_from, boarding_seq, travel_date]
                    );
                }

                // 4. Insert AVAILABLE segment AFTER the booking (if one exists)
                if (old_to > departure_seq) {
                    await connection.query(
                        `INSERT INTO seat_status (train_id, class_type, coach_no, seat_no, from_seq_no, to_seq_no, availability_status, travel_date)
                         VALUES (?, ?, ?, ?, ?, ?, 'AVAILABLE', ?)`,
                        [train_id, class_type, coach_no, seat_no, departure_seq, old_to, travel_date]
                    );
                }
            }
        }
        
        // 5. Commit Transaction
        await connection.commit();
        
        res.json({
            message: "Booking created successfully",
            ticket_id: ticketId,
            total_amount: totalAmount,
        });

    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error("❌ Booking creation error:", err);
        // Provide a more user-friendly message for common errors
        res.status(500).json({ message: err.message || "Booking creation error" });
    } finally {
        if (connection) {
            connection.release();
        }
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
