const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth'); // Added auth middleware

// NEW: Endpoint to fetch detailed seat status for a route segment
router.get('/seat-status', auth, async (req, res) => {
  try {
    const { train_id, class_type, travel_date, boarding_seq, departure_seq } = req.query;

    console.log('--- DEBUG: SEAT STATUS FETCH START ---');
    console.log(`Input: Train=${train_id}, Class=${class_type}, Date=${travel_date}, BoardSeq=${boarding_seq}, DepartSeq=${departure_seq}`);

    if (!train_id || !class_type || !travel_date || !boarding_seq || !departure_seq) {
        console.error('❌ Missing required parameters');
        return res.status(400).json({ message: 'Missing required parameters' });
    }
    
    // Convert to numbers
    const boardSeq = parseInt(boarding_seq);
    const departSeq = parseInt(departure_seq);
    
    // 1. Try to get existing seat segments (Booked or Available)
    const [seatRows] = await pool.query(
      `SELECT 
        ss.id, ss.seat_no, ss.coach_no, ss.from_seq_no, ss.to_seq_no, ss.availability_status,
        si.base_fare_per_km
      FROM seat_status ss
      JOIN seat_inventory si ON ss.train_id = si.train_id AND ss.class_type = si.class_type AND ss.coach_no = si.coach_no
      WHERE ss.train_id = ? 
        AND ss.class_type = ?
        AND ss.travel_date = ?
      ORDER BY ss.coach_no, ss.seat_no, ss.from_seq_no
      `,
      [train_id, class_type, travel_date]
    );

    console.log(`Query 1 (seat_status): Fetched ${seatRows.length} existing segments.`);
    // console.log('Row sample:', seatRows.slice(0, 2)); // Uncomment if you need a deeper look

    // 2. Fallback Logic: If no segments exist for this date/train/class, create them from inventory.
    if (seatRows.length === 0) {
        console.log('INFO: No existing seat segments found. Initializing from inventory...');

        // a. Fetch Max Sequence Number for the route
        const [maxSeqRow] = await pool.query(
            `SELECT MAX(seq_no) as max_seq FROM route_stations WHERE train_id = ?`,
            [train_id]
        );
        const maxSeq = maxSeqRow[0]?.max_seq || 1;
        console.log(`Query 2 (route_stations): Max sequence number is ${maxSeq}`);

        if (maxSeq === 1) {
             console.error('❌ FATAL: Only one station found for train, cannot book segments.');
             return res.status(500).json({ message: 'Train route is not configured correctly.' });
        }


        // b. Fetch seat inventory for coach numbers and total seats
        const [inventoryRows] = await pool.query(
            `SELECT coach_no, total_seats, base_fare_per_km
             FROM seat_inventory
             WHERE train_id = ? AND class_type = ?
            `,
            [train_id, class_type]
        );

        console.log(`Query 3 (seat_inventory): Fetched ${inventoryRows.length} coach entries.`);
        
        if (inventoryRows.length === 0) {
            console.error('❌ ERROR: No seat inventory found for this train and class!');
            // Return empty list if no inventory is found
            return res.json([]); 
        }

        // c. Generate all initial AVAILABLE segments for bulk insert
        const insertValues = [];
        const initialSeats = [];

        for(const inv of inventoryRows) {
            for(let i = 1; i <= inv.total_seats; i++) {
                initialSeats.push({
                    seat_no: i,
                    coach_no: inv.coach_no,
                    availability_status: 'AVAILABLE',
                    base_fare_per_km: inv.base_fare_per_km
                });
                
                // Add values for bulk insert:
                // (train_id, class_type, coach_no, seat_no, from_seq_no, to_seq_no, availability_status, travel_date)
                insertValues.push(train_id, class_type, inv.coach_no, i, 1, maxSeq, 'AVAILABLE', travel_date);
            }
        }
        
        console.log(`Generated ${initialSeats.length} new seat segments for insertion.`);
        
        if (insertValues.length > 0) {
            // d. Perform Bulk Insertion of new AVAILABLE seats
            await pool.query(
                `INSERT INTO seat_status (train_id, class_type, coach_no, seat_no, from_seq_no, to_seq_no, availability_status, travel_date)
                 VALUES ${initialSeats.map(() => '(?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}`,
                 insertValues
             );
             console.log('✅ Bulk insertion of new AVAILABLE segments successful.');
        }

        // e. Re-query the database to get the newly inserted data
        // This is the source of truth for the processing step.
        const [refreshedSeatRows] = await pool.query(
            `SELECT ss.seat_no, ss.coach_no, ss.from_seq_no, ss.to_seq_no, ss.availability_status, si.base_fare_per_km
             FROM seat_status ss
             JOIN seat_inventory si ON ss.train_id = si.train_id AND ss.class_type = si.class_type AND ss.coach_no = si.coach_no
             WHERE ss.train_id = ? AND ss.class_type = ? AND ss.travel_date = ?
             ORDER BY ss.coach_no, ss.seat_no, ss.from_seq_no`,
            [train_id, class_type, travel_date]
        );
        
        console.log(`Query 4 (refreshed): Fetched ${refreshedSeatRows.length} segments after insertion.`);
        return res.json(processSeatSegments(refreshedSeatRows, boardSeq, departSeq));
    }


    // 3. Process existing segments
    // (This part runs if seatRows.length > 0)
    
    // --- Segment Processing Function ---
    function processSeatSegments(rows, boardSeq, departSeq) {
        const seatStatusMap = new Map(); // Key: 'COACH_NO-SEAT_NO'
    
        for (const row of rows) {
            const key = `${row.coach_no}-${row.seat_no}`;
            if (!seatStatusMap.has(key)) {
                // Initialize seat status as AVAILABLE
                seatStatusMap.set(key, { 
                    seat_no: row.seat_no, 
                    coach_no: row.coach_no, 
                    availability_status: 'AVAILABLE', // Default to AVAILABLE for the user's journey
                    base_fare_per_km: row.base_fare_per_km 
                });
            }
            
            const seatData = seatStatusMap.get(key);
            
            // Check for overlap with any BOOKED segment
            // Overlap condition: (Booked_Segment_Start < User_Journey_End) AND (Booked_Segment_End > User_Journey_Start)
            const isBookedAndOverlaps = row.availability_status === 'BOOKED' 
                && row.from_seq_no < departSeq 
                && row.to_seq_no > boardSeq;

            if (isBookedAndOverlaps) {
                // If ANY booked segment overlaps, the seat is marked as BOOKED (unavailable)
                seatData.availability_status = 'BOOKED';
            }
        }
        
        const finalStatus = Array.from(seatStatusMap.values());
        console.log(`--- DEBUG: Seat processing complete. Returning ${finalStatus.length} unique seats. ---`);
        return finalStatus;
    }
    
    // Run the processing function on the initially fetched rows
    const finalSeatStatus = processSeatSegments(seatRows, boardSeq, departSeq);
    res.json(finalSeatStatus);

  } catch (err) {
    console.error('❌ FINAL CATCH ERROR: Error fetching seat status:', err);
    res.status(500).json({ message: 'Error fetching seat status' });
  }
});
// Available trains with seat filter
// ✅ GET Available Trains between two stations on selected date (train start date)
router.get('/available', async (req, res) => {
  try {
    const { from, to, date } = req.query;
    console.log('Available trains request params:', req.query);
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
          AND ss.from_seq_no <= rs_from.seq_no
          AND ss.to_seq_no >= rs_to.seq_no
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
    console.log('Available trains query result:', rows);
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
