import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import SecureImage from "../components/SecureImage";

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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
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
          <span className="text-gray-400 mt-4 text-sm">Loading details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header selectedCity={selectedCity} onCityChange={handleCityChange} />

      {movie && (
        <>
          {/* Movie Hero Banner with blurred backdrop */}
          <div className="relative w-full md:h-[400px] bg-slate-900 overflow-hidden flex items-center border-b border-slate-800">
            {/* Blurred background image */}
            <div className="absolute inset-0 z-0 opacity-20 filter blur-2xl scale-110">
              <SecureImage
                src={movie.banner || "/placeholder-banner.jpg"}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            {/* Radial dark gradient mask */}
            <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/80 to-transparent z-10"></div>

            {/* Main content layer */}
            <div className="max-w-7xl w-full mx-auto px-6 py-8 relative z-20 flex flex-col md:flex-row gap-8 items-center md:items-end">
              {/* Poster card */}
              <div
                className="w-[180px] md:w-[240px] asp
              ect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 -mb-16 md:-mb-24 z-30 self-center md:self-auto"
              >
                <SecureImage
                  src={movie.banner || "/placeholder-poster.jpg"}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Text metadata */}
              <div className="flex-1 text-center md:text-left self-center md:self-auto md:pb-4">
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider">
                  {movie.censorRating || "UA"}
                </span>
                <h2 className="text-3xl md:text-5xl font-black mt-3 tracking-wide text-white drop-shadow-md">
                  {movie.title}
                </h2>

                {/* Metarow */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4 text-xs font-semibold text-gray-300">
                  {movie.rating > 0 && (
                    <span className="flex items-center gap-1 bg-amber-400/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                      <svg
                        className="w-3.5 h-3.5 fill-amber-300"
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
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                    {movie.genre.map((g) => (
                      <span
                        key={g}
                        className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-gray-400"
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
                    className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-gray-200 hover:text-white hover:bg-slate-850 flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <svg
                      className="w-4 h-4 text-rose-500 fill-rose-500"
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
          <main className="max-w-7xl w-full mx-auto px-6 py-12 md:py-16 mt-16 md:mt-24 flex flex-col lg:flex-row gap-12">
            {/* Left Column: Description & Synopsis */}
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-xl font-bold tracking-wide border-l-4 border-indigo-500 pl-3 mb-3">
                  Synopsis
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {movie.description}
                </p>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-900 bg-slate-900/10 text-xs">
                <div>
                  <span className="text-gray-500 block">Censor Rating</span>
                  <span className="text-white font-semibold mt-0.5 block">
                    {movie.censorRating || "UA"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Release Date</span>
                  <span className="text-white font-semibold mt-0.5 block">
                    {movie.releaseDate
                      ? new Date(movie.releaseDate).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Shows Schedule */}
            <div className="w-full lg:w-[650px] space-y-6">
              <h3 className="text-xl font-bold tracking-wide border-l-4 border-indigo-500 pl-3">
                Select Date & Book Show
              </h3>

              {/* Date Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-900">
                {dateTabs.map((tab) => {
                  const isActive = tab.isoString === selectedDate;
                  return (
                    <button
                      key={tab.isoString}
                      onClick={() => setSelectedDate(tab.isoString)}
                      className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-xl border transition-all ${
                        isActive
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                          : "bg-slate-900/60 border-slate-850 text-gray-400 hover:text-white"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wide">
                        {tab.dayName}
                      </span>
                      <span className="text-lg font-black mt-0.5">
                        {tab.dayNum}
                      </span>
                      <span className="text-[10px] tracking-wide mt-0.5 font-semibold">
                        {tab.monthName}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Schedule List */}
              {loading ? (
                <div className="py-12 flex justify-center">
                  <svg
                    className="animate-spin h-8 w-8 text-indigo-500"
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
                <div className="text-center py-6 bg-slate-900/20 border border-slate-800 rounded-xl text-rose-400">
                  {error}
                </div>
              ) : schedule.length === 0 ? (
                <div className="text-center py-10 bg-slate-900/10 border border-dashed border-slate-850 rounded-xl text-gray-500 text-sm">
                  No shows available in{" "}
                  <span className="text-indigo-400 font-bold">
                    {selectedCity}
                  </span>{" "}
                  on this date.
                </div>
              ) : (
                <div className="space-y-4">
                  {schedule.map((theatre) => (
                    <div
                      key={theatre.id}
                      className="p-5 rounded-2xl bg-slate-900/40 border border-slate-850 shadow-md space-y-4"
                    >
                      {/* Theatre Info */}
                      <div>
                        <h4 className="text-base font-bold text-white tracking-wide">
                          {theatre.name}
                        </h4>
                        <p className="text-xs text-gray-500 font-semibold">
                          {theatre.location}, {theatre.city}
                        </p>
                      </div>

                      {/* Show Pills */}
                      <div className="flex flex-wrap gap-2.5">
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
                              className="group flex flex-col items-center px-4 py-2 bg-slate-950 border border-slate-800 hover:border-indigo-500 rounded-xl text-center transition-all cursor-pointer shadow-sm min-w-[100px]"
                            >
                              <span className="text-sm font-black text-indigo-400 group-hover:text-white transition-colors">
                                {formattedTime}
                              </span>
                              <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase">
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
