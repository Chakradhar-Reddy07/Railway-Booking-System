// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const trainsRoutes = require('./routes/trainsRoutes');
const bookingsRoutes = require('./routes/bookingsRoutes');
const paymentsRoutes = require('./routes/paymentsRoutes');
const usersRoutes = require('./routes/usersRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/trains', trainsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/users', usersRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
