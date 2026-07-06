import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchMovies } from "../slices/movieSlice";
import Header from "../components/Header";
import SecureImage from "../components/SecureImage";
import CinemaBackground from "../components/CinemaBackground";
import EventsCarousel from "../components/EventsCarousel";

export default function MoviesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { movies, loading, error, pagination } = useSelector(
    (state) => state.movies,
  );

  // Header filter states
  const [selectedCity, setSelectedCity] = useState(
    localStorage.getItem("city") || "Bangalore",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Sync city to local storage
  const handleCityChange = (city) => {
    setSelectedCity(city);
    localStorage.setItem("city", city);
    setPage(1); // Reset page on filter change
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setPage(1); // Reset page on filter change
  };

  useEffect(() => {
    dispatch(
      fetchMovies({
        page,
        city: selectedCity,
        search: searchQuery,
      }),
    );
  }, [dispatch, page, selectedCity, searchQuery]);

  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-hidden">
      {/* Cinema mosaic background */}
      <CinemaBackground />

      {/* Top projector glow light overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[radial-gradient(circle_at_top,var(--tw-gradient-stops))] from-rose-500/15 via-transparent to-transparent blur-3xl pointer-events-none -z-10"></div>

      <Header
        selectedCity={selectedCity}
        onCityChange={handleCityChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 relative z-10">
        {/* Banner Section - Redesigned as dynamic theater screen */}
        <div className="relative rounded-3xl overflow-hidden mb-10 h-[280px] bg-linear-to-r from-rose-950/40 via-zinc-900/60 to-zinc-950 border border-zinc-800/80 flex items-center p-8 md:p-12 shadow-[0_15px_30px_-10px_rgba(244,63,94,0.1)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-rose-500/10 via-transparent to-transparent"></div>

          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[conic-gradient(from_250deg_at_100%_0%,rgba(244,63,94,0.06),transparent_60deg)] pointer-events-none"></div>

          <div className="max-w-xl relative z-10">
            <span className="px-3.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-black uppercase tracking-widest">
              Now Showing
            </span>
            <h2 className="text-3xl md:text-4xl font-black mt-4 leading-tight text-zinc-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              Grab Your Popcorn, <br />
              Secure the Best Seats in{" "}
              <span className="text-rose-500 text-gradient-rose drop-shadow-sm font-black">
                {selectedCity}
              </span>
              !
            </h2>
            <p className="text-zinc-400 mt-3 text-xs md:text-sm leading-relaxed max-w-md font-medium">
              Explore blockbusters, regional cinema, and independent releases
              with seamless online seat selection.
            </p>
          </div>
        </div>

        <div className="mb-12">
          <EventsCarousel />
        </div>

        <div className="mt-12 flex justify-between items-center mb-8 border-b border-zinc-900 pb-4">
          <h3 className="text-lg md:text-xl font-black tracking-wider uppercase text-zinc-100 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-rose-600 rounded-full inline-block"></span>
            Recommended Movies
          </h3>
          <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800/80">
            {movies?.length || 0} movies found
          </span>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24">
            <div className="relative flex items-center justify-center">
              <div className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-rose-500 opacity-20"></div>
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
            </div>
            <span className="text-zinc-400 mt-6 text-xs font-bold uppercase tracking-wider">
              Discovering movies...
            </span>
          </div>
        ) : error ? (
          <div className="text-center py-16 border border-zinc-800 rounded-2xl bg-zinc-900/10">
            <p className="text-rose-400 font-semibold">{error}</p>
            <button
              onClick={() =>
                dispatch(
                  fetchMovies({
                    page,
                    city: selectedCity,
                    search: searchQuery,
                  }),
                )
              }
              className="mt-5 px-6 py-2 bg-zinc-900 border border-zinc-800 text-rose-400 rounded-xl hover:bg-zinc-800 transition-colors text-xs font-black uppercase tracking-wider"
            >
              Retry
            </button>
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
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
                d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
              ></path>
            </svg>
            <p className="text-zinc-400 text-sm font-medium">
              No movies scheduled in {selectedCity} matching your search.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCity("Bangalore");
              }}
              className="mt-4 text-xs text-rose-400 hover:text-rose-300 font-black uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 px-4 py-1.5 rounded-full"
            >
              Clear filters
            </button>
          </div>
        ) : (
          /* Movies Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {movies.map((movie) => (
              <div
                key={movie.id}
                onClick={() => navigate(`/movie/${movie.id}`)}
                className="group relative bg-zinc-900/30 border border-zinc-800/80 hover:border-rose-500/35 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col shadow-lg hover:shadow-[0_12px_30px_-5px_rgba(244,63,94,0.18)]"
              >
                {/* Poster Image Container */}
                <div className="aspect-2/3 w-full bg-zinc-950 relative overflow-hidden">
                  {movie.banner ? (
                    <SecureImage
                      src={movie.banner}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-linear-to-br from-zinc-900 to-zinc-950 text-center">
                      <svg
                        className="w-10 h-10 text-rose-500/20 mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                        ></path>
                      </svg>
                      <span className="text-xs font-black text-zinc-400 px-2">
                        {movie.title}
                      </span>
                    </div>
                  )}

                  {/* Censor Rating Overlay */}
                  <div className="absolute top-3 left-3 bg-zinc-950/85 border border-zinc-800/80 text-rose-400 text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider shadow-sm">
                    {movie.censorRating || "UA"}
                  </div>

                  {/* Rating Overlay */}
                  {movie.rating > 0 && (
                    <div className="absolute bottom-3 right-3 bg-rose-600/90 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-md">
                      <svg
                        className="w-3.5 h-3.5 text-amber-300 fill-amber-300"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {movie.rating.toFixed(1)}/10
                    </div>
                  )}
                </div>

                {/* Movie Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-black text-zinc-100 tracking-wider truncate group-hover:text-rose-500 transition-colors">
                      {movie.title}
                    </h4>
                    <div className="text-[10px] text-zinc-500 mt-1.5 flex items-center gap-1.5 font-bold uppercase tracking-wider">
                      <span>{movie.language}</span>
                      <span>•</span>
                      <span>{movie.duration} Mins</span>
                    </div>

                    {/* Genres */}
                    {movie.genre && movie.genre.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {movie.genre.slice(0, 3).map((g) => (
                          <span
                            key={g}
                            className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button className="w-full mt-5 py-2.5 bg-rose-600/10 group-hover:bg-rose-600 text-rose-400 group-hover:text-white border border-rose-500/20 group-hover:border-rose-600 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 shadow-md">
                    Book Tickets
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination?.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-16 border-t border-zinc-900 pt-8">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${p === page ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"}`}
                >
                  {p}
                </button>
              ),
            )}

            <button
              onClick={() =>
                setPage((prev) => Math.min(pagination.totalPages, prev + 1))
              }
              disabled={page === pagination.totalPages}
              className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
