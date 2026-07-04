import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import SecureImage from "../components/SecureImage";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCity, setSelectedCity] = useState(
    localStorage.getItem("city") || "Bangalore",
  );

  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "/api/bookings/my-bookings",
          {
            headers: { "access-token": token },
          },
        );
        if (res.data.success) {
          setBookings(res.data.data || []);
        } else {
          setError(res.data.message || "Failed to load bookings");
        }
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, []);

  const handleCityChange = (city) => {
    setSelectedCity(city);
    localStorage.setItem("city", city);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header selectedCity={selectedCity} onCityChange={handleCityChange} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10">
        {/* Title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-wide border-l-4 border-indigo-500 pl-3">
            My Booking History
          </h2>
          <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-wide">
            Your transactions and active tickets
          </p>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <svg
              className="animate-spin h-10 w-10 text-indigo-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-gray-500 mt-4 text-xs font-semibold">
              Retrieving tickets...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-10 border border-slate-800 rounded-xl bg-slate-900/20 text-rose-400">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-900 rounded-2xl bg-slate-900/10">
            <svg
              className="w-12 h-12 text-gray-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              ></path>
            </svg>
            <p className="text-gray-400 font-semibold">
              No tickets booked yet.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-black shadow-lg shadow-indigo-600/30 transition-all"
            >
              Book Movies Now
            </Link>
          </div>
        ) : (
          /* Bookings List */
          <div className="space-y-6">
            {bookings.map((booking) => {
              const movie = booking.movieId;
              const show = booking.showId;
              const showTime = show?.showTime ? new Date(show.showTime) : null;

              const formattedTime = showTime
                ? showTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                : "N/A";

              const formattedDate = showTime
                ? showTime.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "N/A";

              const isConfirmed = booking.status === "CONFIRM";
              const isCancelled = booking.status === "CANCEL";

              return (
                <div
                  key={booking.id}
                  className="flex flex-col md:flex-row bg-slate-900/40 border border-slate-850 hover:border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all duration-300"
                >
                  {/* Left Section: Ticket Info & Details */}
                  <div className="flex-1 p-6 flex flex-col sm:flex-row gap-6">
                    {/* Movie Poster */}
                    <div className="w-[90px] aspect-2/3 rounded-lg overflow-hidden bg-slate-800 self-center sm:self-start flex-shrink-0 border border-slate-800">
                      {movie?.poster || movie?.banner ? (
                        <SecureImage
                          src={movie.poster || movie.banner}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-950 flex items-center justify-center text-slate-800 text-[10px] uppercase font-black text-center p-2">
                          No Pic
                        </div>
                      )}
                    </div>

                    {/* Movie & Show Metadata */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-wide leading-snug">
                          {movie?.title || "Movie Show"}
                        </h3>
                        <p className="text-xs text-indigo-400 mt-0.5 font-bold uppercase">
                          {movie?.language || "Hindi"} •{" "}
                          {movie?.duration || "120"} Mins
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-slate-900 pt-3 text-xs">
                        <div>
                          <span className="text-gray-500 block">Theatre</span>
                          <span className="text-gray-200 font-semibold mt-0.5 block">
                            {show?.theatreId?.name || "Theatre"}
                          </span>
                          <span className="text-gray-500 text-[10px] block leading-tight">
                            {show?.theatreId?.location}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Show Time</span>
                          <span className="text-gray-200 font-semibold mt-0.5 block">
                            {formattedDate}
                          </span>
                          <span className="text-indigo-400 font-black text-[10px] block mt-0.5 uppercase">
                            {formattedTime}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Screen</span>
                          <span className="text-gray-200 font-semibold mt-0.5 block">
                            Auditorium {show?.screenNumber || 1}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">
                            Seats ({booking.seats?.length})
                          </span>
                          <span className="text-emerald-400 font-extrabold mt-0.5 block tracking-wider uppercase">
                            {booking.seats?.join(", ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vertical dotted divider for screen cards */}
                  <div className="hidden md:flex flex-col justify-between items-center w-px relative bg-slate-900 border-l border-dashed border-slate-800">
                    <div className="w-4 h-4 bg-slate-950 rounded-full -mt-2 -ml-2.5 border-b border-slate-850"></div>
                    <div className="w-4 h-4 bg-slate-950 rounded-full -mb-2 -ml-2.5 border-t border-slate-850"></div>
                  </div>

                  {/* Horizontal dotted divider for mobile */}
                  <div className="flex md:hidden border-t border-dashed border-slate-800 my-1 mx-6"></div>

                  {/* Right Section: Ticket Stub / Verification */}
                  <div className="w-full md:w-[220px] p-6 bg-slate-900/60 flex flex-col justify-between items-center text-center gap-4">
                    {/* Status Badge */}
                    <div className="w-full">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
                        Booking Status
                      </span>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-black border mt-1.5 uppercase ${
                          isConfirmed
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : isCancelled
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    {/* Barcode Graphic */}
                    {isConfirmed && booking.ticketId ? (
                      <div className="flex flex-col items-center">
                        {/* Barcode lines */}
                        <div className="flex gap-[2px] items-center h-10 w-36 px-2 bg-white rounded py-1.5 overflow-hidden">
                          {Array.from({ length: 24 }).map((_, idx) => {
                            const widths = [1, 2, 3];
                            const width =
                              widths[Math.floor(Math.sin(idx + 5) * 1.5) + 1] ||
                              1;
                            const isDark = idx % 3 !== 0;
                            return (
                              <div
                                key={idx}
                                className={`h-full bg-slate-950`}
                                style={{
                                  width: `${width}px`,
                                  opacity: isDark ? 1 : 0,
                                }}
                              ></div>
                            );
                          })}
                        </div>
                        <span className="text-[9px] text-gray-500 font-bold font-mono tracking-widest mt-1">
                          {booking.ticketId}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-500 italic">
                        No verification ticket
                      </span>
                    )}

                    {/* Total Amount Paid */}
                    <div className="w-full">
                      <span className="text-[10px] text-gray-500 font-bold uppercase block">
                        Paid Amount
                      </span>
                      <span className="text-base font-black text-white mt-0.5 block">
                        ₹{booking.totalAmount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
