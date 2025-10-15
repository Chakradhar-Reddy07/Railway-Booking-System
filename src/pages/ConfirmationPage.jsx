import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrain, createBooking } from '../services/api';
import { motion } from 'framer-motion';

export default function ConfirmationPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [train, setTrain] = useState(null);
  const [routeStations, setRouteStations] = useState([]);
  const [passengers, setPassengers] = useState([{ name: '', age: '' }]);
  const [classType, setClassType] = useState('3A');
  const [boarding, setBoarding] = useState('');
  const [departure, setDeparture] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadTrain() {
      try {
        const res = await getTrain(id);
        setTrain(res.train);
        if (Array.isArray(res.route)) {
          setRouteStations(res.route);
          if (res.route.length > 1) {
            setBoarding(res.route[0].station_id);
            setDeparture(res.route[res.route.length - 1].station_id);
          }
        }
      } catch (err) {
        console.error('Error loading train details:', err);
      }
    }
    loadTrain();
  }, [id]);

  function updatePassenger(idx, key, val) {
    const arr = [...passengers];
    arr[idx][key] = val;
    setPassengers(arr);
  }

  async function submit(e) {
    e.preventDefault();
    if (!boarding || !departure) return alert('Select boarding and departure');
    setLoading(true);
    try {
      const payload = {
        train_id: id,
        travel_date: date,
        class_type: classType,
        num_of_passengers: passengers.length,
        boarding_station_id: boarding,
        departure_station_id: departure,
        passengers,
      };
      const res = await createBooking(payload);
      alert('Booking created successfully!');
      nav(`/home/payment/${encodeURIComponent(res.ticket_id)}`, {
        state: { amount: res.total_amount },
      });
    } catch (err) {
      console.error(err);
      alert('Booking creation failed');
    } finally {
      setLoading(false);
    }
  }

  if (!train)
    return (
      <div className="page text-center text-indigo-500 mt-10">
        Loading train...
      </div>
    );

  return (
    <div className="page flex justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-white/90 dark:bg-gray-900/70 p-6 rounded-xl shadow-2xl w-full max-w-xl"
      >
        <h2 className="text-2xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">
          {train.train_name}
        </h2>
        <div className="text-gray-700 dark:text-gray-300 mb-4">
          Train ID: {train.train_id}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="flex flex-col">
            <label className="font-semibold mb-1">Travel Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            />
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Class</label>
            <select
              value={classType}
              onChange={(e) => setClassType(e.target.value)}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option>3A</option>
              <option>2A</option>
              <option>SL</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Boarding Station</label>
            <select
              value={boarding}
              onChange={(e) => setBoarding(e.target.value)}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 outline-none"
              required
            >
              <option value="">Select Boarding</option>
              {routeStations.map((s) => (
                <option key={s.station_id} value={s.station_id}>
                  {s.station_name} ({s.city})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="font-semibold mb-1">Departure Station</label>
            <select
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 outline-none"
              required
            >
              <option value="">Select Departure</option>
              {routeStations.map((s) => (
                <option key={s.station_id} value={s.station_id}>
                  {s.station_name} ({s.city})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="font-semibold">Passengers</label>
            {passengers.map((p, i) => (
              <div className="flex gap-2" key={i}>
                <input
                  placeholder="Name"
                  value={p.name}
                  onChange={(e) => updatePassenger(i, 'name', e.target.value)}
                  className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 outline-none"
                  required
                />
                <input
                  placeholder="Age"
                  type="number"
                  value={p.age}
                  onChange={(e) => updatePassenger(i, 'age', e.target.value)}
                  className="w-20 p-2 rounded-lg border border-gray-300 dark:border-gray-600 outline-none"
                  required
                />
              </div>
            ))}
            <button
              type="button"
              className="btn bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2 mt-2"
              onClick={() =>
                setPassengers([...passengers, { name: '', age: '' }])
              }
            >
              + Add Passenger
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg w-full py-3 shadow-lg mt-4"
          >
            {loading ? 'Creating...' : 'Proceed to Payment'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
