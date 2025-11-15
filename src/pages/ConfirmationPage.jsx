import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrain, createBooking } from '../services/api';
import { motion } from 'framer-motion';

export default function ConfirmationPage() {
  const { id ,from,to,traveldate,travelclass} = useParams();
  const nav = useNavigate();

  const [train, setTrain] = useState(null);
  const [routeStations, setRouteStations] = useState([]);
  const [passengers, setPassengers] = useState([{ name: '', age: '' }]);
  const [classType, setClassType] = useState(travelclass);
  const [boarding, setBoarding] = useState(from);
  const [departure, setDeparture] = useState(to);
  const [date, setDate] = useState(traveldate);
  const [loading, setLoading] = useState(false);


  // Load train + route (already sorted by seq_no from backend)
  useEffect(() => {
    async function loadTrain() {
      try {
        const res = await getTrain(id);
        console.log("Loaded train:", res);
        setTrain(res.train);

        if (Array.isArray(res.route)) {
          setRouteStations(res.route);

          // auto-set default stations
          if (res.route.length > 1) {
            setBoarding(res.route[0].station_id.toString());
            setDeparture(res.route[res.route.length - 1].station_id.toString());
          }
        }
      } catch (err) {
        console.error("Error loading train:", err);
      }
    }
    loadTrain();
  }, [id]);


  // Update passenger fields
  function updatePassenger(idx, key, val) {
    const arr = [...passengers];
    arr[idx][key] = val;
    setPassengers(arr);
  }


  // Submit booking
  async function submit(e) {
    e.preventDefault();

    if (!date) return alert("Select travel date.");
    if (!boarding || !departure) return alert("Select stations.");

    const b = Number(boarding);
    const d = Number(departure);

    // Get seq numbers from routeStations (already sorted)
    const bSeq = routeStations.find(s => s.station_id === boarding)?.seq_no;
    const dSeq = routeStations.find(s => s.station_id === departure)?.seq_no;

    if (bSeq === undefined || dSeq === undefined) {
      return alert("Invalid station selection.");
    }

    // UI Validation matching backend distance check
    if (bSeq >= dSeq) {
      return alert("Boarding station must be before destination.");
    }

    // Prepare payload
    const payload = {
      train_id: id,
      travel_date: date,
      class_type: classType,
      num_of_passengers: passengers.length,
      boarding_station_id: boarding,
      departure_station_id: departure,
      passengers: passengers.map(p => ({
        name: p.name.trim(),
        age: Number(p.age)
      }))
    };

    setLoading(true);

    try {
      const res = await createBooking(payload);
console.log("Booking created:", res);
      alert("Booking created!");
      nav(`/home/payment/${encodeURIComponent(res.ticket_id)}`, {
        state: { amount: res.total_amount },
      });

    } catch (err) {
      console.error("Booking failed:", err);

      if (err.response) {
        alert(`Booking failed: ${err.response.data?.message || "Server error"}`);
        console.error("Status:", err.response.status);
        console.error("Data:", err.response.data);
      } else if (err.request) {
        alert("Booking failed: No response from server.");
      } else {
        alert("Error: " + err.message);
      }

    } finally {
      setLoading(false);
    }
  }


  // Loading state
  if (!train)
    return (
      <div className="text-center mt-10 text-indigo-500">
        Loading train...
      </div>
    );


  // Helper: filter forward stations only
  const boardingSeq = routeStations.find(s => s.station_id === boarding)?.seq_no;

  const filteredDestinationStations = routeStations.filter(
    st => st.seq_no > boardingSeq
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

        <div className="font-semibold dark:text-gray-300 mb-4">
          Train ID: {train.train_id}
        </div>

        <form onSubmit={submit} className="space-y-4">

          {/* Travel date */}
          <div className="flex flex-col font-semibold mb-1">
            Travel Date :{date}
          </div>

          {/* Class type */}
          <div className="flex flex-col font-semibold mb-1">
            Class:{classType}
          </div>

          {/* Boarding station */}
          <div className="flex flex-col font-semibold mb-1">
            Boarding Station : {boarding}
          </div>

          {/* Destination station (filtered) */}
          <div className="flex flex-col font-semibold mb-1">
            Destination Station : {departure}
          </div>

          {/* Passengers */}
          <div className="flex flex-col space-y-2">
            <label className="font-semibold">Passengers</label>

            {passengers.map((p, i) => (
              <div className="flex gap-2" key={i}>
                <input
                  placeholder="Name"
                  value={p.name}
                  onChange={(e) => updatePassenger(i, 'name', e.target.value)}
                  required
                  className="flex-1 p-2 rounded-lg border dark:border-gray-600 outline-none"
                />

                <input
                  placeholder="Age"
                  type="number"
                  value={p.age}
                  onChange={(e) => updatePassenger(i, 'age', e.target.value)}
                  required
                  className="w-20 p-2 rounded-lg border dark:border-gray-600 outline-none"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() => setPassengers([...passengers, { name: '', age: '' }])}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg"
            >
              + Add Passenger
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg w-full py-3 shadow-lg"
          >
            {loading ? "Creating..." : "Proceed to Payment"}
          </button>

        </form>
      </motion.div>
    </div>
  );
}
