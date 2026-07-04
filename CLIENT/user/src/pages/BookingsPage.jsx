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
        const res = await axios.get("/api/bookings/my-bookings", {
          headers: { "access-token": token },
        });
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
    <div className="min-h-screen text-white flex flex-col relative overflow-hidden">
      {/* Background radial projection beam */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[radial-gradient(circle_at_top,var(--tw-gradient-stops))] from-rose-500/8 via-transparent to-transparent blur-3xl pointer-events-none -z-10"></div>

      <Header selectedCity={selectedCity} onCityChange={handleCityChange} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 relative z-10">
        {/* Title */}
        <div className="mb-10 border-b border-zinc-900 pb-5">
          <h2 className="text-xl font-black tracking-wider uppercase text-zinc-100 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-rose-600 rounded-full inline-block"></span>
            My Booking History
          </h2>
          <p className="text-[10px] text-zinc-500 mt-1.5 uppercase font-bold tracking-wider">
            Your transactions and active tickets
          </p>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <svg
              className="animate-spin h-10 w-10 text-rose-500"
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
            <span className="text-zinc-500 mt-4 text-xs font-bold uppercase tracking-wider">
              Retrieving tickets...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-10 border border-zinc-800 rounded-2xl bg-zinc-900/10 text-rose-400 text-xs font-bold uppercase tracking-wider">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/10">
            <svg
              className="w-12 h-12 text-zinc-700 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              ></path>
            </svg>
            <p className="text-zinc-400 text-sm font-medium">
              No tickets booked yet.
            </p>
            <Link
              to="/"
              className="mt-5 inline-block px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/20 transition-all"
            >
              Book Movies Now
            </Link>
          </div>
        ) : (
          /* Bookings List */
          <div className="space-y-8">
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
                  className="flex flex-col md:flex-row bg-zinc-900/25 border border-zinc-850 hover:border-zinc-800 rounded-3xl overflow-hidden shadow-lg hover:shadow-[0_8px_25px_rgba(0,0,0,0.4)] transition-all duration-300 relative"
                >
                  {/* Left Section: Ticket Info & Details */}
                  <div className="flex-1 p-6 flex flex-col sm:flex-row gap-6">
                    {/* Movie Poster */}
                    <div className="w-[95px] aspect-2/3 rounded-xl overflow-hidden bg-zinc-950 self-center sm:self-start shrink-0 border border-zinc-800 shadow-md">
                      {movie?.banner ? (
                        <SecureImage
                          src={movie.banner}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-650 text-[10px] uppercase font-black text-center p-2">
                          No Poster
                        </div>
                      )}
                    </div>

                    {/* Movie & Show Metadata */}
                    <div className="flex-1 space-y-3.5">
                      <div>
                        <h3 className="text-base font-black text-zinc-100 tracking-wider uppercase">
                          {movie?.title || "Movie Show"}
                        </h3>
                        <p className="text-[10px] text-rose-500 mt-1 font-bold uppercase tracking-wider">
                          {movie?.language || "Hindi"} •{" "}
                          {movie?.duration || "120"} Mins
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 border-t border-zinc-900/60 pt-4 text-xs">
                        <div>
                          <span className="text-zinc-550 text-[10px] uppercase tracking-wider font-bold block">
                            Theatre
                          </span>
                          <span className="text-zinc-200 font-bold mt-1 block">
                            {show?.theatreId?.name || "Theatre"}
                          </span>
                          <span className="text-zinc-500 text-[9px] uppercase tracking-widest block leading-tight mt-0.5">
                            {show?.theatreId?.location}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-550 text-[10px] uppercase tracking-wider font-bold block">
                            Show Time
                          </span>
                          <span className="text-zinc-200 font-bold mt-1 block">
                            {formattedDate}
                          </span>
                          <span className="text-rose-400 font-black text-[9px] block mt-0.5 uppercase tracking-widest">
                            {formattedTime}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-550 text-[10px] uppercase tracking-wider font-bold block">
                            Screen
                          </span>
                          <span className="text-zinc-200 font-bold mt-1 block uppercase">
                            Auditorium {show?.screenNumber || 1}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-550 text-[10px] uppercase tracking-wider font-bold block">
                            Seats ({booking.seats?.length})
                          </span>
                          <span className="text-rose-450 font-black mt-1 block tracking-wider uppercase text-sm">
                            {booking.seats?.join(", ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Vertical dotted divider for cinema tickets */}
                  <div className="hidden md:flex flex-col justify-between items-center w-px relative border-l border-dashed border-zinc-800">
                    <div className="w-5 h-5 bg-zinc-950 rounded-full -mt-2.5 ml-[-11px] border border-zinc-850"></div>
                    <div className="w-5 h-5 bg-zinc-950 rounded-full -mb-2.5 ml-[-11px] border border-zinc-850"></div>
                  </div>

                  {/* Horizontal dotted divider for mobile */}
                  <div className="flex md:hidden border-t border-dashed border-zinc-850 my-1 mx-6"></div>

                  {/* Right Section: Ticket Stub / Verification */}
                  <div className="w-full md:w-[220px] p-6 bg-zinc-900/10 flex flex-col justify-between items-center text-center gap-5">
                    {/* Status Badge */}
                    <div className="w-full">
                      <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block">
                        Booking Status
                      </span>
                      <span
                        className={`inline-block px-3 py-1.5 rounded-xl text-[10px] font-black border mt-2 uppercase tracking-wider ${
                          isConfirmed
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                            : isCancelled
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    {/* Barcode Graphic */}
                    {isConfirmed && booking.ticketId ? (
                      <div className="flex flex-col items-center">
                        {/* Barcode lines */}
                        <div className="flex gap-[2px] items-center h-10 w-36 px-2 bg-white rounded-lg py-1.5 overflow-hidden shadow-inner">
                          {Array.from({ length: 24 }).map((_, idx) => {
                            const widths = [1, 2, 3];
                            const width =
                              widths[Math.floor(Math.sin(idx + 5) * 1.5) + 1] ||
                              1;
                            const isDark = idx % 3 !== 0;
                            return (
                              <div
                                key={idx}
                                className={`h-full bg-zinc-950`}
                                style={{
                                  width: `${width}px`,
                                  opacity: isDark ? 1 : 0,
                                }}
                              ></div>
                            );
                          })}
                        </div>
                        <span className="text-[8px] text-zinc-500 font-bold font-mono tracking-widest mt-1.5">
                          {booking.ticketId}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-zinc-650 italic font-bold uppercase tracking-wider">
                        No ticket issued
                      </span>
                    )}

                    {/* Total Amount Paid */}
                    <div className="w-full border-t border-zinc-900/60 pt-3">
                      <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block">
                        Paid Amount
                      </span>
                      <span className="text-base font-black text-rose-400 mt-1 block tracking-wider">
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
