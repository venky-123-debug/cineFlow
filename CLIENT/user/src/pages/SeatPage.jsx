import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import Header from "../components/Header";

export default function SeatPage() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [seatData, setSeatData] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState(localStorage.getItem("city") || "Bangalore");

  const [recommendCount, setRecommendCount] = useState(2);
  const [recommendCategory, setRecommendCategory] = useState("STANDARD");
  const [recommendError, setRecommendError] = useState("");
  const [recommendLoading, setRecommendLoading] = useState(false);

  const handleAutoSelect = async () => {
    setRecommendError("");
    setRecommendLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/recommend/${showId}?count=${recommendCount}&category=${recommendCategory}`, {
        headers: { "access-token": token },
      });
      if (res.data.success && res.data.data.seats && res.data.data.seats.length > 0) {
        setSelected(res.data.data.seats);
      } else {
        setRecommendError(res.data.data.message || "No adjacent seats found in this category");
      }
    } catch (err) {
      console.error(err);
      setRecommendError(err.response?.data?.message || "Failed to recommend seats");
    } finally {
      setRecommendLoading(false);
    }
  };

  const loadSeats = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/shows/${showId}/seats`, {
        headers: { "access-token": token },
      });
      if (res.data.success) {
        setSeatData(res.data.data);
      } else {
        setError(res.data.message || "Failed to load seats");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load seats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeats();
  }, [showId]);

  const handleCityChange = (city) => {
    setSelectedCity(city);
    localStorage.setItem("city", city);
    navigate("/");
  };

  // Group seats by row character (A, B, C...)
  const getGroupedSeats = () => {
    if (!seatData?.seats) return {};
    const groups = {};
    
    // Sort seats by row and column number
    const sortedSeats = [...seatData.seats].sort((a, b) => {
      const rowA = a.seatNumber.charAt(0);
      const rowB = b.seatNumber.charAt(0);
      if (rowA !== rowB) return rowA.localeCompare(rowB);
      
      const numA = parseInt(a.seatNumber.substring(1), 10);
      const numB = parseInt(b.seatNumber.substring(1), 10);
      return numA - numB;
    });

    sortedSeats.forEach((seat) => {
      const row = seat.seatNumber.charAt(0);
      if (!groups[row]) {
        groups[row] = [];
      }
      groups[row].push(seat);
    });

    return groups;
  };

  const handleSeatClick = (seatNumber) => {
    setSelected((prev) => {
      if (prev.includes(seatNumber)) {
        return prev.filter((s) => s !== seatNumber);
      } else {
        // Enforce maximum 10 seats per booking
        if (prev.length >= 10) {
          alert("You can select up to 10 seats only.");
          return prev;
        }
        return [...prev, seatNumber];
      }
    });
  };

  const calculateTotalAmount = () => {
    if (!seatData || selected.length === 0) return 0;
    return selected.reduce((sum, seatNum) => {
      const seat = seatData.seats.find((s) => s.seatNumber === seatNum);
      return sum + (seat ? seat.price : 150);
    }, 0);
  };

  const handleCheckout = async () => {
    if (selected.length === 0) return;
    
    setBookingLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const totalAmount = calculateTotalAmount();

      // 1. Lock selected seats for 10 minutes in Redis
      const lockRes = await axios.post(
        `/api/shows/${showId}/lock`,
        { seats: selected },
        { headers: { "access-token": token } }
      );

      if (!lockRes.data.success) {
        throw new Error(lockRes.data.message || "Failed to lock seats. Some seats might have been locked or booked.");
      }

      // 2. Create Razorpay Order
      const orderRes = await axios.post(
        "/api/bookings",
        {
          showId,
          seats: selected,
          totalAmount,
        },
        { headers: { "access-token": token } }
      );

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || "Failed to initiate booking order");
      }

      const { orderId, amount, currency, key } = orderRes.data.data;

      // 3. Open Razorpay payment gateway
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: "CineFlow Ticket Booking",
        description: `${seatData.movie?.title || "Movie Show"} - ${selected.join(", ")}`,
        order_id: orderId,
        handler: async function (paymentResponse) {
          try {
            // 4. Verify payment signature on server & finalize booking
            const verifyRes = await axios.post(
              "/api/bookings/verify-payment",
              {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                showId,
                seats: selected,
                totalAmount,
              },
              { headers: { "access-token": token } }
            );

            if (verifyRes.data.success) {
              navigate("/my-bookings");
            } else {
              alert("Payment verification failed! " + verifyRes.data.message);
              loadSeats();
              setSelected([]);
            }
          } catch (verifyErr) {
            console.error(verifyErr);
            alert("Verification Request Error: " + (verifyErr.response?.data?.message || verifyErr.message));
            loadSeats();
            setSelected([]);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: {
          color: "#F84464", // Crimson Red theme matching BookMyShow
        },
        modal: {
          ondismiss: function () {
            setBookingLoading(false);
          }
        }
      };

      const razorpayGateway = new window.Razorpay(options);
      razorpayGateway.open();

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "An error occurred during booking checkout.");
      setBookingLoading(false);
      loadSeats();
    }
  };

  const groupedSeats = getGroupedSeats();
  const showTime = seatData?.showTime ? new Date(seatData.showTime) : null;
  const formattedTime = showTime ? showTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
  const formattedDate = showTime ? showTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "";

  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-hidden">
      {/* Top projector light beam effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-rose-500/8 via-transparent to-transparent blur-3xl pointer-events-none -z-10"></div>
      
      <Header selectedCity={selectedCity} onCityChange={handleCityChange} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 flex flex-col justify-between relative z-10">
        
        {/* Detail Summary Header */}
        {seatData && (
          <div className="mb-8 p-5 rounded-3xl border border-zinc-800 bg-zinc-900/20 backdrop-blur-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="text-[10px] text-rose-400 font-black uppercase tracking-widest">Booking Screen</span>
              <h2 className="text-xl font-black mt-1 text-zinc-100 uppercase tracking-wide">{seatData.movie?.title}</h2>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">
                {seatData.theatre?.name} • {seatData.theatre?.location}
              </p>
            </div>
            
            <div className="flex gap-6 border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 pl-0 md:pl-6 text-xs">
              <div>
                <span className="text-zinc-500 uppercase tracking-wider font-bold block mb-1">Date & Time</span>
                <span className="text-zinc-200 font-black block">{formattedDate} at {formattedTime}</span>
              </div>
              <div>
                <span className="text-zinc-500 uppercase tracking-wider font-bold block mb-1">Screen</span>
                <span className="text-zinc-200 font-black block uppercase">Auditorium {seatData.screenNumber || 1}</span>
              </div>
            </div>
          </div>
        )}

        {/* Smart Seat Auto-Select Assistant */}
        {!loading && seatData && (
          <div className="mb-6 p-4 rounded-3xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-rose-500/10 text-rose-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Smart Assist</h4>
                <p className="text-[10px] text-zinc-500 font-semibold">Let us find the best contiguous seats for you</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Seats:</span>
                <select
                  value={recommendCount}
                  onChange={(e) => setRecommendCount(parseInt(e.target.value))}
                  className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-rose-500 font-bold"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? "Ticket" : "Tickets"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 font-bold uppercase">Tier:</span>
                <select
                  value={recommendCategory}
                  onChange={(e) => setRecommendCategory(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-rose-500 font-bold"
                >
                  <option value="PREMIUM">Premium</option>
                  <option value="STANDARD">Standard</option>
                  <option value="ECONOMY">Economy</option>
                </select>
              </div>

              <button
                onClick={handleAutoSelect}
                disabled={recommendLoading}
                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider py-1.5 px-4 rounded-xl transition duration-200 shadow-md shadow-rose-950/50 flex items-center gap-2"
              >
                {recommendLoading ? "Finding..." : "Auto Select"}
              </button>
            </div>
            {recommendError && (
              <div className="w-full text-xs text-rose-500 font-semibold px-2 mt-1">
                ⚠️ {recommendError}
              </div>
            )}
          </div>
        )}

        {/* Seat Layout Map */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-rose-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-zinc-500 mt-4 text-xs font-bold uppercase tracking-wider">Generating seat map...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center my-6">
            
            {/* Screen mock illustration */}
            <div className="w-full max-w-lg mx-auto mb-16 text-center relative">
              <div className="w-full h-1.5 bg-gradient-to-r from-rose-500/20 via-rose-500 to-rose-500/20 rounded-full shadow-[0_-5px_15px_rgba(244,63,94,0.6)]"></div>
              {/* Projection glow shape */}
              <div className="absolute top-1.5 left-12 right-12 h-20 bg-gradient-to-b from-rose-500/5 to-transparent blur-md -z-10 rounded-b-full"></div>
              <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.25em] mt-3.5 block">All eyes this way (Screen)</span>
            </div>

            {error && (
              <div className="mb-6 p-4.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs w-full max-w-md text-center font-bold tracking-wide uppercase">
                {error}
              </div>
            )}

            {/* Seat Map */}
            <div className="w-full overflow-x-auto pb-6 flex justify-center">
              <div className="flex flex-col gap-3.5 min-w-[650px] px-6">
                {Object.keys(groupedSeats).map((row) => (
                  <div key={row} className="flex items-center gap-5">
                    {/* Left row label */}
                    <span className="w-6 text-sm font-black text-zinc-600 text-center uppercase">{row}</span>

                    {/* Seat row items */}
                    <div className="flex-1 flex items-center justify-center gap-2">
                      {groupedSeats[row].map((seat) => {
                        const isSelected = selected.includes(seat.seatNumber);
                        const isBooked = seat.status === "BOOKED" || seat.status === "LOCKED";
                        
                        // Dynamic class based on pricing categories
                        let catStyles = "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700";
                        if (seat.category === "PREMIUM") {
                          catStyles = "bg-amber-600/15 hover:bg-amber-600/25 text-amber-300 border-amber-500/25";
                        } else if (seat.category === "STANDARD") {
                          catStyles = "bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border-rose-500/15";
                        }

                        if (isSelected) {
                          catStyles = "bg-rose-600 text-white font-black border-rose-500 shadow-md shadow-rose-600/30 scale-105";
                        }

                        return (
                          <button
                            key={seat.seatNumber}
                            disabled={isBooked}
                            onClick={() => handleSeatClick(seat.seatNumber)}
                            className={`w-8.5 h-8.5 rounded-xl text-[10px] font-black border transition-all flex items-center justify-center cursor-pointer ${catStyles} ${isBooked ? "opacity-20 bg-zinc-900 border-zinc-950 text-zinc-650 cursor-not-allowed line-through" : ""}`}
                            title={`${seat.seatNumber} - {seat.category} (₹${seat.price})`}
                          >
                            {seat.seatNumber.substring(1)}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right row label */}
                    <span className="w-6 text-sm font-black text-zinc-600 text-center uppercase">{row}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legends panel */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-[10px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-900/30 border border-zinc-850 px-6 py-3 rounded-full">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-rose-600 border border-rose-500"></div>
                <span className="text-zinc-300">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-amber-500/20 border border-amber-500/30"></div>
                <span className="text-zinc-400">Premium (₹250)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-rose-500/10 border border-rose-500/20"></div>
                <span className="text-zinc-400">Standard (₹200)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-zinc-800 border border-zinc-700"></div>
                <span className="text-zinc-400">Economy (₹150)</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <div className="w-3.5 h-3.5 rounded bg-zinc-900 border border-zinc-950 line-through"></div>
                <span className="text-zinc-400">Unavailable</span>
              </div>
            </div>

          </div>
        )}

        {/* Footer Checkout Summary */}
        <div className="border-t border-zinc-900 pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            {selected.length > 0 ? (
              <>
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Selected Seats ({selected.length})</span>
                <p className="text-sm font-black text-rose-500 mt-1 tracking-wide uppercase">
                  {selected.join(", ")}
                </p>
              </>
            ) : (
              <span className="text-xs text-zinc-400 italic">Please select at least one seat to book.</span>
            )}
          </div>

          <div className="flex items-center gap-8">
            {selected.length > 0 && (
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block">Total Payable</span>
                <span className="text-2xl font-black text-rose-400 mt-0.5 block tracking-wide">
                  ₹{calculateTotalAmount()}
                </span>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={selected.length === 0 || bookingLoading}
              className="px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-rose-600/20 flex items-center gap-2"
            >
              {bookingLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Proceed to Checkout"
              )}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
