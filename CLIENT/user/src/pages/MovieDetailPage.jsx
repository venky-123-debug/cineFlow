import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import SecureImage from "../components/SecureImage";
import CinemaBackground from "../components/CinemaBackground";

export default function MovieDetailPage() {
  const { movieId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCity, setSelectedCity] = useState(
    localStorage.getItem("city") || "Bangalore",
  );
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD
  });

  // Generate date tabs for the next 5 days
  const dateTabs = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      isoString: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      monthName: d.toLocaleDateString("en-US", { month: "short" }),
    };
  });

  const handleCityChange = (city) => {
    setSelectedCity(city);
    localStorage.setItem("city", city);
  };

  useEffect(() => {
    const loadMovieAndSchedule = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");

        // 1. Fetch movie details
        const movieRes = await axios.get(`/api/movies/${movieId}`, {
          headers: { "access-token": token },
        });
        setMovie(movieRes.data.data);

        // 2. Fetch grouped schedule by city & date
        const scheduleRes = await axios.get("/api/shows/schedule", {
          headers: { "access-token": token },
          params: {
            movieId,
            city: selectedCity,
            date: selectedDate,
          },
        });
        setSchedule(scheduleRes.data.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch movie details or schedules.");
      } finally {
        setLoading(false);
      }
    };
    loadMovieAndSchedule();
  }, [movieId, selectedCity, selectedDate]);

  if (loading && !movie) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
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
            Loading details...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-hidden">
      {/* Cinema mosaic background */}
      <CinemaBackground />

      {/* Top spotlight projection overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(circle_at_top,var(--tw-gradient-stops))] from-rose-500/10 via-transparent to-transparent blur-3xl pointer-events-none -z-10"></div>

      <Header selectedCity={selectedCity} onCityChange={handleCityChange} />

      {movie && (
        <>
          {/* Movie Hero Banner with blurred backdrop */}
          <div className="relative w-full md:h-[400px] bg-zinc-900/10 overflow-hidden flex items-center border-b border-zinc-900/60 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.5)]">
            {/* Blurred background image */}
            <div className="absolute inset-0 z-0 opacity-15 filter blur-3xl scale-110">
              <SecureImage
                src={movie.banner || "/placeholder-banner.jpg"}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            {/* Radial dark gradient mask */}
            <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/80 to-transparent z-10"></div>

            {/* Main content layer */}
            <div className="max-w-7xl w-full mx-auto px-6 py-8 relative z-20 flex flex-col md:flex-row gap-8 items-center md:items-end">
              {/* Poster card */}
              <div className="w-[180px] md:w-[240px] aspect-2/3 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-950 -mb-16 md:-mb-24 z-30 self-center md:self-auto">
                <SecureImage
                  src={movie.banner || "/placeholder-poster.jpg"}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Text metadata */}
              <div className="flex-1 text-center md:text-left self-center md:self-auto md:pb-4">
                <span className="px-3.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest">
                  {movie.censorRating || "UA"}
                </span>
                <h2 className="text-3xl md:text-5xl font-black mt-4 tracking-wider text-zinc-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] uppercase">
                  {movie.title}
                </h2>

                {/* Metarow */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-5 text-xs font-bold text-zinc-300">
                  {movie.rating > 0 && (
                    <span className="flex items-center gap-1.5 bg-rose-500/15 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-xl shadow-sm">
                      <svg
                        className="w-3.5 h-3.5 fill-rose-500 text-rose-500"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {movie.rating.toFixed(1)}/10
                    </span>
                  )}
                  <span>•</span>
                  <span>{movie.duration} Mins</span>
                  <span>•</span>
                  <span>{movie.language}</span>
                  <span>•</span>
                  <span>
                    {movie.releaseDate
                      ? new Date(movie.releaseDate).toLocaleDateString(
                          "en-US",
                          { year: "numeric", month: "long", day: "numeric" },
                        )
                      : "N/A"}
                  </span>
                </div>

                {/* Genre pills */}
                {movie.genre && movie.genre.length > 0 && (
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-5">
                    {movie.genre.map((g) => (
                      <span
                        key={g}
                        className="text-[10px] px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="self-center md:self-end md:pb-4 flex flex-col gap-2">
                {movie.trailerUrl && (
                  <a
                    href={movie.trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-black uppercase tracking-wider text-zinc-200 hover:text-white hover:border-rose-500 hover:shadow-[0_4px_15px_rgba(244,63,94,0.15)] flex items-center justify-center gap-2.5 transition-all duration-300 shadow-md"
                  >
                    <svg
                      className="w-4.5 h-4.5 text-rose-500 fill-rose-500"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Watch Trailer
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Bottom booking details and schedule */}
          <main className="max-w-7xl w-full mx-auto px-6 py-12 md:py-16 mt-16 md:mt-24 flex flex-col lg:flex-row gap-12 relative z-20">
            {/* Left Column: Description & Synopsis */}
            <div className="flex-1 space-y-8">
              <div className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-3xl backdrop-blur-sm">
                <h3 className="text-base font-black tracking-wider uppercase text-zinc-100 flex items-center gap-2 mb-4">
                  <span className="w-1 h-5 bg-rose-600 rounded-full inline-block"></span>
                  Synopsis
                </h3>
                <p className="text-zinc-400 leading-relaxed text-sm font-medium">
                  {movie.description}
                </p>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4 p-5 rounded-3xl border border-zinc-900 bg-zinc-900/20 text-xs font-bold">
                <div>
                  <span className="text-zinc-500 block uppercase tracking-wider text-[10px]">
                    Censor Rating
                  </span>
                  <span className="text-zinc-200 mt-1 block font-black uppercase text-sm">
                    {movie.censorRating || "UA"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block uppercase tracking-wider text-[10px]">
                    Release Date
                  </span>
                  <span className="text-zinc-200 mt-1 block font-black text-sm">
                    {movie.releaseDate
                      ? new Date(movie.releaseDate).toLocaleDateString(
                          undefined,
                          { dateStyle: "medium" },
                        )
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Shows Schedule */}
            <div className="w-full lg:w-[620px] space-y-6">
              <h3 className="text-base font-black tracking-wider uppercase text-zinc-100 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-rose-600 rounded-full inline-block"></span>
                Select Date & Book Show
              </h3>

              {/* Date Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-3 border-b border-zinc-900/80">
                {dateTabs.map((tab) => {
                  const isActive = tab.isoString === selectedDate;
                  return (
                    <button
                      key={tab.isoString}
                      onClick={() => setSelectedDate(tab.isoString)}
                      className={`shrink-0 flex flex-col items-center px-4.5 py-3 rounded-2xl border transition-all duration-300 min-w-[75px] ${
                        isActive
                          ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/20"
                          : "bg-zinc-900/60 border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700"
                      }`}
                    >
                      <span className="text-[9px] uppercase font-black tracking-wider opacity-80">
                        {tab.dayName}
                      </span>
                      <span className="text-xl font-black mt-1">
                        {tab.dayNum}
                      </span>
                      <span className="text-[9px] tracking-widest mt-1 font-black uppercase">
                        {tab.monthName}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Schedule List */}
              {loading ? (
                <div className="py-16 flex justify-center">
                  <svg
                    className="animate-spin h-8 w-8 text-rose-500"
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
                </div>
              ) : error ? (
                <div className="text-center py-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold uppercase tracking-wider">
                  {error}
                </div>
              ) : schedule.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/10 border border-dashed border-zinc-850 rounded-2xl text-zinc-500 text-xs font-bold uppercase tracking-wider">
                  No shows available in{" "}
                  <span className="text-rose-500 font-black">
                    {selectedCity}
                  </span>{" "}
                  on this date.
                </div>
              ) : (
                <div className="space-y-4">
                  {schedule.map((theatre) => (
                    <div
                      key={theatre.id}
                      className="p-6 rounded-3xl bg-zinc-900/20 border border-zinc-850/60 shadow-md space-y-4 hover:border-zinc-800 transition-colors"
                    >
                      {/* Theatre Info */}
                      <div>
                        <h4 className="text-sm font-black text-zinc-100 tracking-wider">
                          {theatre.name}
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                          {theatre.location}, {theatre.city}
                        </p>
                      </div>

                      {/* Show Pills */}
                      <div className="flex flex-wrap gap-2.5 pt-1">
                        {theatre.shows.map((show) => {
                          const showTimeObj = new Date(show.showTime);
                          const formattedTime = showTimeObj.toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            },
                          );
                          return (
                            <button
                              key={show.id}
                              onClick={() => navigate(`/seat/${show.id}`)}
                              className="group flex flex-col items-center px-4.5 py-2.5 bg-zinc-950 border border-zinc-850 hover:border-rose-500 hover:shadow-[0_4px_12px_rgba(244,63,94,0.15)] rounded-2xl text-center transition-all duration-300 cursor-pointer min-w-[105px]"
                            >
                              <span className="text-xs font-black text-rose-500 group-hover:text-white transition-colors">
                                {formattedTime}
                              </span>
                              <span className="text-[9px] text-zinc-500 font-black mt-1.5 uppercase tracking-widest opacity-60">
                                Sc. {show.screenNumber || 1}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </>
      )}
    </div>
  );
}
