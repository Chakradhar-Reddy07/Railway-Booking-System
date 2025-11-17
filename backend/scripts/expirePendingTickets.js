// scripts/expirePendingTickets.js
const pool = require("../config/db");

const EXPIRY_MINUTES = 15; // Pending tickets older than this will expire

async function expirePendingTickets() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Get all PENDING tickets older than EXPIRY_MINUTES
    const [pendingTickets] = await connection.query(
      `SELECT ticket_id, travel_date FROM tickets
       WHERE status = 'PENDING'
       AND TIMESTAMPDIFF(MINUTE, created_at, NOW()) > ?`,
      [EXPIRY_MINUTES]
    );

    if (pendingTickets.length === 0) {
      console.log("✅ No pending tickets to expire.");
      await connection.commit();
      connection.release();
      return;
    }

    console.log(`⚠ Expiring ${pendingTickets.length} pending tickets...`);

    for (const ticket of pendingTickets) {
      const ticketId = ticket.ticket_id;

      // 2. Restore BOOKED seat segments created during /create
      await connection.query(
        `DELETE ss FROM seat_status ss
         JOIN passengers p ON CONCAT(ss.coach_no, '-', ss.seat_no) = p.seat_allocated
         WHERE p.ticket_id = ? AND ss.availability_status = 'BOOKED'`,
        [ticketId]
      );

      // 3. Update ticket status to EXPIRED
      await connection.query(
        `UPDATE tickets SET status = 'EXPIRED' WHERE ticket_id = ?`,
        [ticketId]
      );
    }

    await connection.commit();
    connection.release();
    console.log(`✅ Expired ${pendingTickets.length} pending tickets.`);
  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("❌ Error expiring pending tickets:", err);
  }
}

// If run manually
if (require.main === module) {
  expirePendingTickets().then(() => process.exit(0));
}

// Export function for periodic cron job
module.exports = { expirePendingTickets };
