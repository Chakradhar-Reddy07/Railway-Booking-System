import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getTrain, createBooking, getSeatStatus } from '../services/api';
import { motion } from 'framer-motion';

// --- Simple Seat Component for Visualization ---
const Seat = ({ seat, selected, onClick }) => {
  let bgColor = 'bg-green-400 hover:bg-green-500'; // Default Available
  let cursor = 'cursor-pointer';

  if (seat.availability_status === 'BOOKED') {
    bgColor = 'bg-red-400';
    cursor = 'cursor-not-allowed';
  } else if (selected) {
    bgColor = 'bg-blue-600 hover:bg-blue-700';
  }

  return (
    <div
      onClick={seat.availability_status === 'AVAILABLE' ? onClick : null}
      className={`h-6 w-6 rounded-md shadow-sm flex items-center justify-center text-xs font-bold text-white transition-colors ${bgColor} ${cursor}`}
      title={seat.availability_status}
    >
      {seat.seat_no}
    </div>
  );
};

export default function ConfirmationPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams(); 
  const nav = useNavigate();

  const [train, setTrain] = useState(null);
  const [routeStations, setRouteStations] = useState([]);

  // --- NEW SEAT/DATA STATES ---
  const [fullSeatMap, setFullSeatMap] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]); 
  const [baseFarePerSeat, setBaseFarePerSeat] = useState(0); 
  const [boardingSeq, setBoardingSeq] = useState(null);
  const [departureSeq, setDepartureSeq] = useState(null);
  const [seatMapLoading, setSeatMapLoading] = useState(false);
  // -----------------------------

  const [passengers, setPassengers] = useState([{ name: '', age: '' }]); 
  const [loading, setLoading] = useState(false);

  // Extract data from URL (these values are now fixed/non-editable)
  const trainId = id;
  const initialClassType = searchParams.get('class') || '3A';
  const initialBoarding = searchParams.get('from') || '';
  const initialDeparture = searchParams.get('to') || '';
  const initialDate = searchParams.get('date') || '';

  // Use the initial values as fixed state (no setters needed for these)
  const classType = initialClassType;
  const boarding = initialBoarding;
  const departure = initialDeparture;
  const date = initialDate;

  // --- UTILITY FUNCTIONS ---

  // Get seats for the currently selected coach
  const seatsForCoach = fullSeatMap
    .filter((s) => s.coach_no === selectedCoach)
    .sort((a, b) => a.seat_no - b.seat_no);

  // Handle seat selection logic
  function toggleSeat(seat) {
    const isSelected = selectedSeats.some(
      (s) => s.seat_no === seat.seat_no && s.coach_no === seat.coach_no
    );

    if (isSelected) {
      // Remove seat
      setSelectedSeats(
        selectedSeats.filter(
          (s) => s.seat_no !== seat.seat_no || s.coach_no !== seat.coach_no
        )
      );
    } else if (selectedSeats.length < 6) {
      // Add seat (Limit to 6 seats per booking)
      setSelectedSeats([...selectedSeats, seat]);
    } else {
      alert('You can book a maximum of 6 tickets at a time.');
    }
  }

  // Auto-manage passenger forms based on selected seats
  useEffect(() => {
    // If seats are selected, the number of passengers MUST match
    if (selectedSeats.length > 0) {
      const newPassengers = Array(selectedSeats.length).fill().map((_, i) => passengers[i] || { name: '', age: '' });
      setPassengers(newPassengers);
    } 
    // If no seats are selected, reset passengers to a single empty form
    else if (selectedSeats.length === 0 && passengers.length !== 1) {
        setPassengers([{ name: '', age: '' }]);
    }
  }, [selectedSeats.length]);


  // --- INITIAL DATA FETCH (TRAIN & ROUTE) ---
  useEffect(() => {
    async function loadTrain() {
      try {
        const res = await getTrain(trainId);
        setTrain(res.train);
        if (Array.isArray(res.route)) {
          setRouteStations(res.route);

          // Find sequence numbers and distances based on URL params
          const bSeq = res.route.find(s => s.station_id === boarding)?.seq_no || null;
          const dSeq = res.route.find(s => s.station_id === departure)?.seq_no || null;
          
          setBoardingSeq(bSeq);
          setDepartureSeq(dSeq);
        }
      } catch (err) {
        console.error('Error loading train details:', err);
      }
    }
    loadTrain();
  }, [trainId, boarding, departure]); 


  // --- SEAT STATUS FETCH ---
  useEffect(() => {
    // Fetch seats only when all parameters are ready
    if (!trainId || !classType || !date || !boardingSeq || !departureSeq) {
      setFullSeatMap([]);
      setCoaches([]);
      setSelectedCoach(null);
      return;
    }

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
        const res = await getSeatStatus(params);
        
        setFullSeatMap(res);
        
        // Group seats by coach to get coach list
        const coachesList = [...new Set(res.map(s => s.coach_no))].sort();
        setCoaches(coachesList);

        // Set the first coach if none is selected
        if(coachesList.length > 0) {
            setSelectedCoach(coachesList[0]);
            // Set base fare from any valid seat
            setBaseFarePerSeat(res[0]?.base_fare_per_km || 0);
        } else {
            setSelectedCoach(null);
            setBaseFarePerSeat(0);
        }

      } catch (err) {
        console.error('Error fetching seat status:', err);
        setFullSeatMap([]);
        setCoaches([]);
      } finally {
        setSeatMapLoading(false);
      }
    }

    fetchSeats();
  }, [trainId, classType, date, boardingSeq, departureSeq]); 

  // --- PASSENGER MANAGEMENT ---
  function updatePassenger(idx, key, val) {
    const arr = [...passengers];
    arr[idx][key] = val;
    setPassengers(arr);
  }

  // --- SUBMISSION ---
  async function submit(e) {
    e.preventDefault();
    
    // ⭐️ Validation 1: Must select a seat
    if (selectedSeats.length === 0) {
        return alert('Please select at least one seat before proceeding to payment.');
    }
    
    // ⭐️ Validation 2: Ensure all required fields are filled
    const incompletePassenger = passengers.find(p => !p.name || !p.age || parseInt(p.age) <= 0);
    if (incompletePassenger) {
        return alert('Please fill in valid Name and Age for all selected passengers.');
    }

    if (!boarding || !departure) return alert('Boarding and Departure stations are missing.');
    
    setLoading(true);
    
    try {
      // Attach selected seat data to each passenger
      const passengersWithSeats = passengers.map((p, i) => ({
        ...p,
        seat_no: selectedSeats[i]?.seat_no || null,
        coach_no: selectedSeats[i]?.coach_no || null,
      }));
      
      const payload = {
        train_id: trainId,
        travel_date: date,
        class_type: classType,
        num_of_passengers: passengers.length,
        boarding_station_id: boarding,
        departure_station_id: departure,
        passengers: passengersWithSeats, 
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

  // Helper to find station name from ID
  const getStationName = (id) => {
    return routeStations.find(s => s.station_id === id)?.station_name || id;
  };

  // Calculate Distance in KM for accurate amount display
  const boardingDistance = routeStations.find(s => s.station_id === boarding)?.distance_from_source || 0;
  const departureDistance = routeStations.find(s => s.station_id === departure)?.distance_from_source || 0;
  const tripDistance = Math.max(0, departureDistance - boardingDistance);

  // Total amount calculation for display
  const totalAmountDisplay = selectedSeats.length * baseFarePerSeat * tripDistance;


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
          
          {/* TRAIN DETAILS (FIXED/READ-ONLY) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Travel Date (Fixed)</label>
              <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 font-medium text-gray-700 dark:text-gray-300">
                {date}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Class (Fixed)</label>
              <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 font-medium text-gray-700 dark:text-gray-300">
                {classType}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="font-semibold mb-1">Boarding Station (Fixed)</label>
              <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 font-medium text-gray-700 dark:text-gray-300">
                {getStationName(boarding)}
              </div>
            </div>

            <div className="flex flex-col">
              <label className="font-semibold mb-1">Departure Station (Fixed)</label>
              <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 font-medium text-gray-700 dark:text-gray-300">
                {getStationName(departure)}
              </div>
            </div>
          </div>
          
          {/* SEAT SELECTION SECTION */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2 text-indigo-600 dark:text-indigo-400">
              Select Seats ({selectedSeats.length} selected)
            </h3>
            
            {seatMapLoading && <div className="text-center text-gray-500">Loading seat map...</div>}

            {!seatMapLoading && coaches.length === 0 && (
                <div className="text-center text-red-500 font-semibold">
                    No seats found for this class and date. (Check seat\_inventory data!)
                </div>
            )}
            
            {coaches.length > 0 && (
              <>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {coaches.map((coach) => (
                    <button
                      key={coach}
                      type="button"
                      onClick={() => setSelectedCoach(coach)}
                      className={`px-3 py-1 text-sm rounded-full font-medium transition-colors ${
                        selectedCoach === coach
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-800'
                      }`}
                    >
                      {coach}
                    </button>
                  ))}
                </div>

                {selectedCoach && (
                  <div className="mt-4 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900">
                    <h4 className="font-semibold mb-3 text-center">Coach {selectedCoach}</h4>
                    
                    {/* Set grid to 6 columns for 2 seats + 1 aisle + 3 seats */}
                    <div className="grid grid-cols-6 gap-2 justify-center">
                      {seatsForCoach.map((seat, index) => (
                        <React.Fragment key={seat.seat_no}>
                          {/* Render the actual seat */}
                          <Seat
                              seat={seat}
                              selected={selectedSeats.some(
                                  (s) => s.seat_no === seat.seat_no && s.coach_no === seat.coach_no
                              )}
                              onClick={() => toggleSeat(seat)}
                          />

                          {/* Inject Aisle after the 2nd seat in the visual 5-seat group */}
                          {/* The 2nd seat has a 0-based index of 1 (index % 5 === 1) */}
                          {index % 5 === 1 && (
                              <div className="h-6 w-6"></div> 
                          )}

                          {/* Add a line break placeholder (col-span-6) after the 5th seat to enforce a new row */}
                          {/* The 5th seat has a 0-based index of 4 (index % 5 === 4) */}
                          {index % 5 === 4 && (
                              <div className="col-span-6 h-2"></div> 
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* PASSENGER DETAILS SECTION */}
          <div className="flex flex-col space-y-2">
            <label className="font-semibold">
              Passenger Details 
              {selectedSeats.length > 0 && ` (${passengers.length} forms to fill)`}
            </label>
            
            {passengers.map((p, i) => (
              <div className="flex gap-2 items-center" key={i}>
                <span className="w-6 text-center font-bold text-gray-600 dark:text-gray-400">
                    {i + 1}.
                </span>
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
            
            {/* The Add Passenger button is only visible if no seats have been selected yet */}
            {selectedSeats.length === 0 && passengers.length < 6 && (
                <button
                    type="button"
                    className="btn bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-2 mt-2"
                    onClick={() => setPassengers([...passengers, { name: '', age: '' }])}
                >
                    + Add Passenger
                </button>
            )}
          </div>
          
          {/* TOTAL AMOUNT DISPLAY */}
          {selectedSeats.length > 0 && (
              <div className="text-xl font-bold text-right pt-2 text-green-600 dark:text-green-400">
                  Total Amount: ₹ {totalAmountDisplay.toFixed(2)}
              </div>
          )}

          <button
            type="submit"
            // ⭐️ FIXED: Button is disabled if loading or if NO seats are selected
            disabled={loading || selectedSeats.length === 0}
            className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg w-full py-3 shadow-lg mt-4"
          >
            {loading 
                ? 'Creating...' 
                : (selectedSeats.length === 0 ? 'Select Seats to Proceed' : `Proceed to Payment for ${selectedSeats.length} Tickets`)
            }
          </button>
        </form>
      </motion.div>
    </div>
  );
}