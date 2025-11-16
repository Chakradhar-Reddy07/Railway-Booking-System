import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getTrain, createBooking, getSeatStatus } from '../services/api';
import { motion } from 'framer-motion';

// Helper component to render the seat
const Seat = ({ seat, isSelected, isBooked, onClick, passengerName }) => {
  let className = "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-all duration-150 cursor-pointer shadow-md";

  if (isBooked) {
    className += " bg-red-400 text-white cursor-not-allowed";
  } else if (isSelected) {
    className += " bg-green-500 hover:bg-green-600 text-white ring-2 ring-green-700";
  } else {
    className += " bg-indigo-100 hover:bg-indigo-200 text-indigo-800 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600";
  }

  return (
    <motion.div
      className={className}
      onClick={isBooked ? null : onClick}
      whileTap={isBooked ? {} : { scale: 0.95 }}
      title={isBooked ? `Booked for segment` : isSelected ? `Selected by ${passengerName}` : 'Available'}
    >
      {seat.seat_no}
    </motion.div>
  );
};


export default function ConfirmationPage() {
  const { id: trainId } = useParams();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  // Initial data derived from query parameters
  const initialClass = searchParams.get('class') || '3A';
  const initialBoarding = searchParams.get('from') || '';
  const initialDeparture = searchParams.get('to') || '';
  const initialDate = searchParams.get('date') || '';
  
  // Base State
  const [train, setTrain] = useState(null);
  const [routeStations, setRouteStations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Booking State
  const [classType] = useState(initialClass);
  const [boarding] = useState(initialBoarding);
  const [departure] = useState(initialDeparture);
  const [date] = useState(initialDate);
  const [baseFarePerSeat, setBaseFarePerSeat] = useState(0);

  // Seat/Passenger State
  const [coaches, setCoaches] = useState([]); // List of coach_no for the class
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [fullSeatMap, setFullSeatMap] = useState([]); // Full seat status for the class/train/date
  const [passengers, setPassengers] = useState([{ name: '', age: '', seat_no: null, coach_no: null }]); // Array of { name, age, seat_no, coach_no }
  const [seatMapLoading, setSeatMapLoading] = useState(false);


  // --- Helper Functions to get Sequence Numbers ---
  const boardingSeq = useMemo(() => {
    return routeStations.find(rs => rs.station_id === boarding)?.seq_no;
  }, [routeStations, boarding]);

  const departureSeq = useMemo(() => {
    return routeStations.find(rs => rs.station_id === departure)?.seq_no;
  }, [routeStations, departure]);
  
  // --- Effects ---

  // 1. Load Train Details (only once)
  useEffect(() => {
    async function loadTrain() {
      try {
        const res = await getTrain(trainId);
        setTrain(res.train);
        if (Array.isArray(res.route)) {
          setRouteStations(res.route);
        }
      } catch (err) {
        console.error('Error loading train details:', err);
      }
    }
    loadTrain();
  }, [trainId]);


// 2. Fetch Seat Status and Coaches when route/class changes
  useEffect(() => {
    // --- STRICT PARAMETER CHECK ---
    if (!trainId || !classType || !boarding || !departure || !date || !boardingSeq || !departureSeq) {
        // Log to console if any parameter is missing (for debugging)
        console.log('ConfirmationPage: Skipping seat fetch due to missing parameters:', {
            trainId, classType, boarding, departure, date, boardingSeq, departureSeq
        });
        setCoaches([]);
        setFullSeatMap([]);
        setSelectedCoach(null);
        return;
    }
    // --- END STRICT PARAMETER CHECK ---


    async function fetchSeats() {
      setSeatMapLoading(true);
      try {
        const params = {
          train_id: trainId,
          class_type: classType,
          travel_date: date,
          boarding_seq: boardingSeq,
          departure_seq: departureSeq,
        };
        // The console.log you added is here:
        // console.log('Fetching seat status with params:', params); 
        const res = await getSeatStatus(params);
        
        setFullSeatMap(res);
        
        // Group seats by coach to get coach list
        const coachesList = [...new Set(res.map(s => s.coach_no))].sort();
        setCoaches(coachesList);

        // Set the first coach if none is selected
        if(coachesList.length > 0 && (!selectedCoach || !coachesList.includes(selectedCoach))) {
            setSelectedCoach(coachesList[0]);
        }

        // Set the base fare per seat
        if (res.length > 0) {
            setBaseFarePerSeat(res[0].base_fare_per_km);
        } else {
            setBaseFarePerSeat(0);
        }
        
      } catch (err) {
        console.error('Error fetching seat status:', err);
        setCoaches([]);
        setFullSeatMap([]);
        setSelectedCoach(null);
      } finally {
        setSeatMapLoading(false);
      }
    }

    fetchSeats();
  }, [trainId, classType, boarding, departure, date, boardingSeq, departureSeq, selectedCoach]); // Removed routeStations from dependencies to prevent excessive calls
  // 3. Keep Passenger Count and Seat Selection in sync
  useEffect(() => {
    const numSelectedSeats = passengers.filter(p => p.seat_no).length;
    const numPassengerFields = passengers.length;

    // If seats were selected, but passengers fields are fewer, add empty passenger fields
    if (numSelectedSeats > numPassengerFields) {
        setPassengers(prev => [...prev, ...Array(numSelectedSeats - numPassengerFields).fill({ name: '', age: '', seat_no: null, coach_no: null })]);
    }
    // If passenger fields are more than seats selected, trim the list (but keep seated passengers at the start)
    if (numPassengerFields > numSelectedSeats && numSelectedSeats > 0) {
        // Find the index of the first unseated passenger
        const firstUnseatedIndex = passengers.findIndex(p => p.seat_no === null);
        if (firstUnseatedIndex !== -1) {
             setPassengers(passengers.slice(0, firstUnseatedIndex + 1)); // Keep one empty field after all seated passengers
        } else {
             // Should not happen if logic is correct, but safe fallback
             setPassengers(passengers.slice(0, numSelectedSeats));
        }
    }
    // Initial state: If no seats selected, make sure there is exactly one empty passenger field.
    if (numSelectedSeats === 0 && passengers.length === 0) {
        setPassengers([{ name: '', age: '', seat_no: null, coach_no: null }]);
    }
  }, [passengers]);
  
  // --- Handlers ---

  const handleSeatClick = (seat) => {
    const { seat_no, coach_no } = seat;
    const isCurrentlySelected = passengers.some(p => p.seat_no === seat_no && p.coach_no === coach_no);
    
    // Seat Deselection
    if (isCurrentlySelected) {
      // Find the passenger associated with this seat
      const passengerToUpdateIndex = passengers.findIndex(p => p.seat_no === seat_no && p.coach_no === coach_no);
      
      const newPassengers = passengers.map((p, i) => 
        i === passengerToUpdateIndex ? { ...p, seat_no: null, coach_no: null } : p
      );
      
      // Move the deselected passenger (now unseated) to the end of the seated group
      const deselectedPassenger = newPassengers.splice(passengerToUpdateIndex, 1)[0];
      newPassengers.push(deselectedPassenger);

      // Ensure we keep only one empty passenger field, if any
      const finalPassengers = newPassengers.filter((p, i, arr) => 
        p.seat_no !== null || (p.seat_no === null && i === arr.length - 1)
      );
      
      setPassengers(finalPassengers.length > 0 ? finalPassengers : [{ name: '', age: '', seat_no: null, coach_no: null }]);

    } 
    // Seat Selection
    else {
        // Check max passenger limit (e.g., 6)
        if(passengers.filter(p => p.seat_no).length >= 6) {
            alert("Maximum 6 passengers per booking.");
            return;
        }

        // Find the first passenger field without a seat_no (the "empty" field at the end)
        let passengerIndex = passengers.findIndex(p => p.seat_no === null);
        
        // If no empty field exists (e.g., we filtered it out, or on initial load), use the last index.
        if (passengerIndex === -1) {
            passengerIndex = passengers.length - 1; 
        }

        // Update the passenger at that index with the new seat
        const newPassengers = passengers.map((p, i) => 
            i === passengerIndex ? { ...p, seat_no, coach_no } : p
        );
        
        // Sort seated passengers to the front
        newPassengers.sort((a, b) => (a.seat_no === null) - (b.seat_no === null)); 

        setPassengers(newPassengers);
    }
  };

  const updatePassenger = (index, field, value) => {
    const newPassengers = [...passengers];
    newPassengers[index][field] = value;
    setPassengers(newPassengers);
  };
  
  // --- Calculations ---
  const numSelectedSeats = passengers.filter(p => p.seat_no).length;
  const totalDisplayFare = Math.round(baseFarePerSeat * numSelectedSeats * (
    (routeStations.find(rs => rs.station_id === departure)?.distance_from_source || 0) - 
    (routeStations.find(rs => rs.station_id === boarding)?.distance_from_source || 0)
  ));

  // Helper to get seats for the currently selected coach, grouped into rows for the grid
  const selectedCoachSeats = useMemo(() => {
    const seats = fullSeatMap.filter(s => s.coach_no === selectedCoach);
    seats.sort((a, b) => a.seat_no - b.seat_no);
    
    // Group seats for a 4-column display
    const rows = [];
    for (let i = 0; i < seats.length; i += 4) {
        rows.push(seats.slice(i, i + 4));
    }
    return rows;
  }, [fullSeatMap, selectedCoach]);

  
  // --- Submission ---

  async function submit(e) {
    e.preventDefault();
    const seatedPassengers = passengers.filter(p => p.seat_no);
    if (!seatedPassengers.every(p => p.name && p.age)) {
        alert("Please ensure all selected seats have a passenger name and age filled out.");
        return;
    }
    if (seatedPassengers.length === 0) {
        alert("Please select at least one seat.");
        return;
    }

    setLoading(true);
    try {
      // The payload now includes seat information for each passenger
      const bookingPayload = {
        train_id: trainId,
        travel_date: date,
        class_type: classType,
        boarding_station_id: boarding,
        departure_station_id: departure,
        // Send only seated passengers
        passengers: seatedPassengers.map(p => ({
            name: p.name,
            age: parseInt(p.age),
            coach_no: p.coach_no,
            seat_no: p.seat_no,
            // berth_preference can be added if you implement a preference field
        })),
        // total_amount is calculated on the backend for security, but we send what we know
      };
      const res = await createBooking(bookingPayload);
      
      // Navigate to payment with the generated ticketId and total amount (from backend response)
      nav(`/home/payment/${res.ticket_id}`, { state: { amount: res.total_amount } });

    } catch (err) {
      console.error('Error creating booking:', err);
      alert(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  }

  if (!train) return <div className="page text-center text-indigo-500">Loading train details...</div>;

  return (
    <div className="page flex flex-col items-center justify-start py-10 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-white/90 dark:bg-gray-900/70 p-6 rounded-2xl shadow-2xl w-full max-w-5xl"
      >
        <h2 className="text-3xl font-bold mb-6 text-indigo-600 dark:text-indigo-400 border-b pb-2">
          Confirm Your Booking
        </h2>

        <form onSubmit={submit} className="space-y-6">
            <div className='flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg'>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                    <span className="text-indigo-600">{train.train_name}</span> - {classType}
                </h3>
                <div className="text-lg font-bold text-green-600">
                    Total Fare: ₹ {totalDisplayFare}
                </div>
            </div>

            {/* --- Coach Selector --- */}
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-6">Select Coach</h3>
            <div className="flex flex-wrap gap-3 p-3 bg-indigo-50 dark:bg-gray-800 rounded-lg shadow-inner">
                {seatMapLoading && <span className='text-gray-600 dark:text-gray-400'>Loading coaches and seats...</span>}
                {!seatMapLoading && coaches.map(coach => (
                    <button
                        key={coach}
                        type="button"
                        onClick={() => setSelectedCoach(coach)}
                        className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                            selectedCoach === coach 
                                ? 'bg-indigo-600 text-white shadow-lg' 
                                : 'bg-white text-indigo-600 border border-indigo-300 hover:bg-indigo-100 dark:bg-gray-700 dark:text-indigo-400 dark:border-gray-600 dark:hover:bg-gray-600'
                        }`}
                    >
                        {coach}
                    </button>
                ))}
                {!seatMapLoading && coaches.length === 0 && <span className='text-red-500'>No seats available for this class/route.</span>}
            </div>
            
            {/* --- Seat Map --- */}
            {selectedCoach && (
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <h4 className="text-lg font-bold mb-4 text-center text-gray-800 dark:text-gray-100">
                        Coach {selectedCoach} - Seat Map
                    </h4>
                    
                    {/* Legend */}
                    <div className="flex justify-center gap-6 mb-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className='flex items-center gap-1'><span className='w-3 h-3 rounded-full bg-indigo-100 dark:bg-gray-700'></span> Available</div>
                        <div className='flex items-center gap-1'><span className='w-3 h-3 rounded-full bg-green-500'></span> Selected</div>
                        <div className='flex items-center gap-1'><span className='w-3 h-3 rounded-full bg-red-400'></span> Booked/Unavailable</div>
                    </div>

                    {/* Seat Grid */}
                    <div className="flex flex-col items-center">
                        <div className="border-x-4 border-gray-300 dark:border-gray-600 p-2 space-y-2">
                            {selectedCoachSeats.map((row, rowIndex) => (
                                <div key={rowIndex} className="flex gap-4">
                                    {row.map((seat) => {
                                        const isBooked = seat.availability_status === 'BOOKED';
                                        const selectedPassenger = passengers.find(p => p.seat_no === seat.seat_no && p.coach_no === seat.coach_no);
                                        const isSelected = !!selectedPassenger;
                                        
                                        return (
                                            <Seat
                                                key={seat.seat_no}
                                                seat={seat}
                                                isSelected={isSelected}
                                                isBooked={isBooked}
                                                passengerName={selectedPassenger?.name}
                                                onClick={() => handleSeatClick(seat)}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {/* --- Passenger Details --- */}
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-6 border-t pt-4">Passenger Details</h3>
            <div className="space-y-4">
              {passengers.map((p, i) => (
                <div key={i} className={`p-4 rounded-lg border transition-all ${p.seat_no ? 'border-green-400 bg-green-50/50 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700'}`}>
                    <h4 className='font-bold mb-2'>
                        Passenger {i + 1} 
                        {p.seat_no && <span className='ml-2 text-indigo-600 dark:text-indigo-400'>({p.coach_no} - Seat {p.seat_no})</span>}
                    </h4>
                    <div className="flex gap-2">
                        <input
                            placeholder="Name"
                            value={p.name}
                            onChange={(e) => updatePassenger(i, 'name', e.target.value)}
                            className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                            disabled={!p.seat_no} // Disable input if no seat is selected for this passenger
                        />
                        <input
                            placeholder="Age"
                            type="number"
                            value={p.age}
                            onChange={(e) => updatePassenger(i, 'age', e.target.value)}
                            className="w-20 p-2 rounded-lg border border-gray-300 dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                            disabled={!p.seat_no} // Disable input if no seat is selected for this passenger
                        />
                    </div>
                    {!p.seat_no && (
                        <p className='mt-2 text-sm text-red-500'>
                            Please select a seat from the map above.
                        </p>
                    )}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || numSelectedSeats === 0 || !passengers.filter(p => p.seat_no).every(p => p.name && p.age)}
              className={`btn ${loading || numSelectedSeats === 0 || !passengers.filter(p => p.seat_no).every(p => p.name && p.age) ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-semibold rounded-lg w-full py-3 shadow-lg mt-4`}
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </button>
        </form>
      </motion.div>
    </div>
  );
}