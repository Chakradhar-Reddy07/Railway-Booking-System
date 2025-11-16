// frontend/src/services/api.js
import axios from 'axios';
import { authHeader } from './auth';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Auth
export async function signup(data) {
  console.log("Signup data:", data);
  const res = await axios.post(`${API_BASE}/auth/signup`, data);
  return res.data;
}

export async function login(data) {
  console.log("Login data:", data);
  const res = await axios.post(`${API_BASE}/auth/login`, data);
  return res.data;
}

// Trains
export async function getAvailableTrains(params) {
  const res = await axios.get(`${API_BASE}/trains/available`, { params });
  return res.data;
}

export async function getTrain(id) {
  const res = await axios.get(`${API_BASE}/trains/${encodeURIComponent(id)}`);
  return res.data;
}

// Bookings
export async function createBooking(data) {
  const res = await axios.post(`${API_BASE}/bookings/create`, data, { headers: authHeader() });
  return res.data;
}

export async function myBookings() {
  const res = await axios.get(`${API_BASE}/bookings/my`, { headers: authHeader() });
  return res.data;
}

// Payments
export async function pay(data) {
  const res = await axios.post(`${API_BASE}/payments/pay`, data, { headers: authHeader() });
  return res.data;
}

// Profile
export async function profile() {
  const token = localStorage.getItem('token');

  return axios.get('http://localhost:5000/api/users/profile', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  .then(res => res.data);
}
// 🚅 NEW: Update Profile API function
export async function updateProfile(data) {
    // Send the user data to the backend for update. 
    // The authHeader() ensures the request is authorized.
    const res = await axios.put(`${API_BASE}/users/profile`, data, { headers: authHeader() });
    
    // The backend should return the updated user object
    return res.data;
}
export async function getSeatStatus(params) {
  console.log('Fetching seat status with params:', params);
  const res = await axios.get(`${API_BASE}/trains/seat-status`, { params, headers: authHeader() });
  return res.data;
}