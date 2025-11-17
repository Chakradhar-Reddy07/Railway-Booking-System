const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth'); // Added auth middleware

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

		// 1. Fetch full seat inventory (This is the source of truth for ALL seats/coaches)
		const [inventoryRows] = await pool.query(
			`SELECT coach_no, total_seats, base_fare_per_km
			 FROM seat_inventory
			 WHERE train_id = ? AND class_type = ?`,
			[train_id, class_type]
		);

		if (inventoryRows.length === 0) {
			console.error('❌ ERROR: No seat inventory found for this train and class!');
			return res.json([]);
		}

		// 2. Get existing seat segments (Booked or Available)
		const [seatRows] = await pool.query(
			`SELECT 
				 ss.id, ss.seat_no, ss.coach_no, ss.from_seq_no, ss.to_seq_no, ss.availability_status
			 FROM seat_status ss
			 WHERE ss.train_id = ? 
				 AND ss.class_type = ?
				 AND ss.travel_date = ?
			 ORDER BY ss.coach_no, ss.seat_no, ss.from_seq_no
			 `,
			[train_id, class_type, travel_date]
		);

		console.log(`Query 2 (seat_status): Fetched ${seatRows.length} existing segments.`);


		// 3. Initialization/Fallback Logic: If no segments exist, create them from inventory.
		let segmentsToProcess = seatRows;

		if (seatRows.length === 0) {
			console.log('INFO: No existing seat segments found. Initializing from inventory...');

			// Fetch Max Sequence Number for the route
			const [maxSeqRow] = await pool.query(
				`SELECT MAX(seq_no) as max_seq FROM route_stations WHERE train_id = ?`,
				[train_id]
			);
			const maxSeq = maxSeqRow[0]?.max_seq || 1;

			if (maxSeq > 1) {
				// Generate all initial AVAILABLE segments for bulk insert
				const insertValues = [];
				for(const inv of inventoryRows) {
					for(let i = 1; i <= inv.total_seats; i++) {
						// (train_id, class_type, coach_no, seat_no, from_seq_no, to_seq_no, availability_status, travel_date)
						insertValues.push(train_id, class_type, inv.coach_no, i, 1, maxSeq, 'AVAILABLE', travel_date);
					}
				}

				if (insertValues.length > 0) {
					// --- FIX: Implement Batch Insertion to avoid MySQL packet size limits ---
					const BATCH_SIZE = 1000; // 1000 rows per batch
					const valuesPerBatch = BATCH_SIZE * 8; // 8 columns per row
					const totalBatches = Math.ceil(insertValues.length / valuesPerBatch);

					console.log(`INFO: Performing bulk insert in ${totalBatches} batches.`);

					for (let b = 0; b < totalBatches; b++) {
						const batchStart = b * valuesPerBatch;
						const batchEnd = (b + 1) * valuesPerBatch;
						const batchValues = insertValues.slice(batchStart, batchEnd);

						if (batchValues.length > 0) {
							// Prepare placeholders for the current batch
							const placeholderRows = Array(batchValues.length / 8).fill('(?, ?, ?, ?, ?, ?, ?, ?)').join(', ');

							await pool.query(
								`INSERT INTO seat_status (train_id, class_type, coach_no, seat_no, from_seq_no, to_seq_no, availability_status, travel_date)
								 VALUES ${placeholderRows}`,
								batchValues
							);
						}
					}
					console.log('✅ Batch insertion of new AVAILABLE segments successful.');
					// --------------------------------------------------------------------------

					// Re-query the database to get the newly inserted data
					const [refreshedSeatRows] = await pool.query(
						`SELECT ss.seat_no, ss.coach_no, ss.from_seq_no, ss.to_seq_no, ss.availability_status
						 FROM seat_status ss
						 WHERE ss.train_id = ? AND ss.class_type = ? AND ss.travel_date = ?
						 ORDER BY ss.coach_no, ss.seat_no, ss.from_seq_no`,
						[train_id, class_type, travel_date]
					);
					segmentsToProcess = refreshedSeatRows;
				}
			}
		}


		// --- Refactored Segment Processing Function ---
		function processSeatSegments(rows, inventory, boardSeq, departSeq) {
			const seatStatusMap = new Map(); // Key: 'COACH_NO-SEAT_NO'

			// 1. Initialize ALL seats from the inventory as AVAILABLE (Source of Truth)
			for (const inv of inventory) {
				for (let i = 1; i <= inv.total_seats; i++) {
					const key = `${inv.coach_no}-${i}`;
					seatStatusMap.set(key, {
						seat_no: i,
						coach_no: inv.coach_no,
						availability_status: 'AVAILABLE',
						base_fare_per_km: inv.base_fare_per_km // Use base fare from inventory
					});
				}
			}

			// 2. Iterate over the actual segments and mark conflicts as BOOKED
			for (const row of rows) {
				const key = `${row.coach_no}-${row.seat_no}`;
				if (!seatStatusMap.has(key)) continue; // Skip if seat doesn't exist in inventory

				const seatData = seatStatusMap.get(key);

				// Overlap condition: Check if the segment is BOOKED AND intersects the user's journey
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

		// 4. Run the processing function
		const finalSeatStatus = processSeatSegments(segmentsToProcess, inventoryRows, boardSeq, departSeq);
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
		if (!from || !to || !date)
			return res.status(400).json({ message: 'from, to, and date are required' });

		// Convert date to weekday (for route_stations)
		const days = ['sun','mon','tue','wed','thu','fri','sat'];
		const weekday = days[new Date(date).getDay()];

		const sql = 	`
			SELECT 
				t.train_id,
				t.train_name,
				si.class_type,
				rs_from.departure_time AS from_departure,
				rs_to.arrival_time AS to_arrival,
				SUM(si.total_seats) AS total_seats_in_class,
				
				-- CRITICAL FIX: Calculate available seats (defaults to total capacity if uninitialized)
				(CASE
					-- Check if ANY seat_status entry exists for this train/class/date combination
					WHEN EXISTS (
						SELECT 1 FROM seat_status ss_exist
						WHERE ss_exist.train_id = t.train_id
						AND ss_exist.class_type = si.class_type
						AND ss_exist.travel_date = ? 
					)
					-- If entries EXIST, calculate available segments (will be 0 if none cover the route)
					THEN COUNT(CASE WHEN ss.availability_status = 'AVAILABLE' 
									 AND ss.from_seq_no <= rs_from.seq_no 
									 AND ss.to_seq_no >= rs_to.seq_no 
									 THEN 1 
								END)
					-- If NO entries EXIST (uninitialized train/class/date), return total capacity
					ELSE SUM(si.total_seats)
				END) AS available_seats
				
			FROM trains t
			JOIN route_stations rs_from 
				ON rs_from.train_id = t.train_id
			JOIN route_stations rs_to 
				ON rs_to.train_id = t.train_id
			JOIN seat_inventory si 
				ON si.train_id = t.train_id
			-- LEFT JOIN is used for the availability calculation (ss)
			LEFT JOIN seat_status ss 
				ON ss.train_id = t.train_id
				AND ss.class_type = si.class_type
				AND ss.coach_no = si.coach_no
				-- CRITICAL FIX: Match the requested travel date exactly
				AND ss.travel_date = ? 
			WHERE 
				rs_from.station_id = ?
				AND rs_to.station_id = ?
				AND rs_from.seq_no < rs_to.seq_no
				-- Only check the departure day for train running status
				AND rs_from.${weekday} = 1 
			GROUP BY 
				t.train_id, t.train_name, si.class_type, rs_from.departure_time, rs_to.arrival_time
			ORDER BY 
				t.train_name;
		`;
		// Pass the date parameter multiple times as required by the query: [Date for EXISTS, Date for LEFT JOIN, From, To]
		const [rows] = await pool.query(sql, [date, date, from, to]); 
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