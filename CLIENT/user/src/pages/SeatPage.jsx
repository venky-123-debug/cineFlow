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
          color: "#6366f1",
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header selectedCity={selectedCity} onCityChange={handleCityChange} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8 flex flex-col justify-between">
        
        {/* Detail Summary Header */}
        {seatData && (
          <div className="mb-8 p-4 rounded-xl border border-slate-900 bg-slate-900/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Booking Screen</span>
              <h2 className="text-xl font-bold mt-1 text-white">{seatData.movie?.title}</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {seatData.theatre?.name} • {seatData.theatre?.location}
              </p>
            </div>
            
            <div className="flex gap-4 border-l border-slate-900 pl-0 md:pl-6 text-sm">
              <div>
                <span className="text-gray-500 text-xs block">Date & Time</span>
                <span className="text-white font-bold mt-0.5 block">{formattedDate} at {formattedTime}</span>
              </div>
              <div>
                <span className="text-gray-500 text-xs block">Screen</span>
                <span className="text-white font-bold mt-0.5 block">Auditorium {seatData.screenNumber || 1}</span>
              </div>
            </div>
          </div>
        )}

        {/* Seat Layout Map */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-500 mt-4 text-xs font-semibold">Generating seat map...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center my-6">
            
            {/* Screen mock illustration */}
            <div className="w-full max-w-md mx-auto mb-16 text-center">
              <div className="w-full h-2.5 bg-gradient-to-b from-indigo-500/80 to-transparent rounded-full filter blur-[1px] shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.25em] mt-3 block">Cinema Screen This Way</span>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs w-full max-w-md text-center">
                {error}
              </div>
            )}

            {/* Seat Map */}
            <div className="w-full overflow-x-auto pb-4 flex justify-center">
              <div className="flex flex-col gap-2.5 min-w-[600px] px-4">
                {Object.keys(groupedSeats).map((row) => (
                  <div key={row} className="flex items-center gap-4">
                    {/* Left row label */}
                    <span className="w-6 text-sm font-black text-gray-600 text-center uppercase">{row}</span>

                    {/* Seat row items */}
                    <div className="flex-1 flex items-center justify-center gap-1.5">
                      {groupedSeats[row].map((seat) => {
                        const isSelected = selected.includes(seat.seatNumber);
                        const isBooked = seat.status === "BOOKED" || seat.status === "LOCKED";
                        
                        // Dynamic class based on pricing categories
                        let catStyles = "bg-slate-800 hover:bg-slate-750 text-gray-300 border-slate-700";
                        if (seat.category === "PREMIUM") {
                          catStyles = "bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/30";
                        } else if (seat.category === "STANDARD") {
                          catStyles = "bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border-indigo-500/20";
                        }

                        if (isSelected) {
                          catStyles = "bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-md shadow-emerald-500/20";
                        }

                        return (
                          <button
                            key={seat.seatNumber}
                            disabled={isBooked}
                            onClick={() => handleSeatClick(seat.seatNumber)}
                            className={`w-8 h-8 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center cursor-pointer ${catStyles} ${isBooked ? "opacity-25 bg-slate-900 border-slate-950 text-gray-600 cursor-not-allowed border-dashed line-through" : ""}`}
                            title={`${seat.seatNumber} - ${seat.category} (₹${seat.price})`}
                          >
                            {seat.seatNumber.substring(1)}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right row label */}
                    <span className="w-6 text-sm font-black text-gray-600 text-center uppercase">{row}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legends panel */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs font-semibold text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500 border border-emerald-400"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/30"></div>
                <span>Premium (₹250)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-indigo-500/20 border border-indigo-500/20"></div>
                <span>Standard (₹200)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-800 border border-slate-700"></div>
                <span>Economy (₹150)</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <div className="w-4 h-4 rounded bg-slate-900 border border-slate-950 line-through"></div>
                <span>Unavailable</span>
              </div>
            </div>

          </div>
        )}

        {/* Footer Checkout Summary */}
        <div className="border-t border-slate-900 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            {selected.length > 0 ? (
              <>
                <span className="text-xs text-gray-500 font-bold uppercase">Selected Seats ({selected.length})</span>
                <p className="text-sm font-black text-white mt-0.5 tracking-wide uppercase">
                  {selected.join(", ")}
                </p>
              </>
            ) : (
              <span className="text-sm text-gray-400 italic">Please select at least one seat to book.</span>
            )}
          </div>

          <div className="flex items-center gap-6">
            {selected.length > 0 && (
              <div className="text-right">
                <span className="text-xs text-gray-500 font-bold uppercase block">Total Payable</span>
                <span className="text-2xl font-black text-emerald-400 mt-0.5 block">
                  ₹{calculateTotalAmount()}
                </span>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={selected.length === 0 || bookingLoading}
              className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-extrabold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
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
