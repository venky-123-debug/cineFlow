import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchMovies } from "../slices/movieSlice";
import Header from "../components/Header";
import SecureImage from "../components/SecureImage";

export default function MoviesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { movies, loading, error, pagination } = useSelector((state) => state.movies);
  
  // Header filter states
  const [selectedCity, setSelectedCity] = useState(localStorage.getItem("city") || "Bangalore");
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
    dispatch(fetchMovies({ 
      page, 
      city: selectedCity, 
      search: searchQuery 
    }));
  }, [dispatch, page, selectedCity, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header 
        selectedCity={selectedCity} 
        onCityChange={handleCityChange} 
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        
        {/* Banner Section */}
        <div className="relative rounded-2xl overflow-hidden mb-10 h-[280px] bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-slate-800 flex items-center p-8 md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
          <div className="max-w-xl relative z-10">
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider">Now Showing</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3 leading-tight text-white drop-shadow-md">
              Grab Your Popcorn, <br />
              Secure the Best Seats in <span className="text-indigo-400">{selectedCity}</span>!
            </h2>
            <p className="text-gray-400 mt-2 text-sm md:text-base">
              Explore blocks, blockbusters, regional cinema, and independent releases with seamless online seat selection.
            </p>
          </div>
        </div>

        {/* Content Heading */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl md:text-2xl font-bold tracking-wide border-l-4 border-indigo-500 pl-3">
            Recommended Movies
          </h3>
          <span className="text-xs text-gray-500 font-bold uppercase">{movies?.length || 0} movies found</span>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <svg className="animate-spin h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-400 mt-4 text-sm font-medium">Discovering movies...</span>
          </div>
        ) : error ? (
          <div className="text-center py-20 border border-slate-800 rounded-xl bg-slate-900/20">
            <p className="text-rose-400 font-semibold">{error}</p>
            <button 
              onClick={() => dispatch(fetchMovies({ page, city: selectedCity, search: searchQuery }))}
              className="mt-4 px-4 py-2 bg-slate-900 border border-slate-800 text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
            <svg className="w-12 h-12 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path>
            </svg>
            <p className="text-gray-400 font-medium">No movies scheduled in {selectedCity} matching your search.</p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedCity("Bangalore"); }}
              className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 font-bold"
            >
              Clear filters
            </button>
          </div>
        ) : (
          /* Movies Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <div
                key={movie.id}
                onClick={() => navigate(`/movie/${movie.id}`)}
                className="group relative bg-slate-900/40 border border-slate-850 hover:border-indigo-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col shadow-lg"
              >
                {/* Poster Image Container */}
                <div className="aspect-[2/3] w-full bg-slate-800 relative overflow-hidden">
                  {movie.banner ? (
                    <SecureImage
                      src={movie.banner}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-950 to-slate-900 text-center">
                      <svg className="w-8 h-8 text-indigo-500/50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path>
                      </svg>
                      <span className="text-xs font-bold text-gray-400">{movie.title}</span>
                    </div>
                  )}

                  {/* Censor Rating Overlay */}
                  <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                    {movie.censorRating || "UA"}
                  </div>

                  {/* Rating Overlay */}
                  {movie.rating > 0 && (
                    <div className="absolute bottom-3 right-3 bg-indigo-600/90 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-md">
                      <svg className="w-3.5 h-3.5 text-amber-300 fill-amber-300" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {movie.rating.toFixed(1)}/10
                    </div>
                  )}
                </div>

                {/* Movie Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white tracking-wide truncate group-hover:text-indigo-400 transition-colors">
                      {movie.title}
                    </h4>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-semibold">
                      <span>{movie.language}</span>
                      <span>•</span>
                      <span>{movie.duration} Mins</span>
                    </div>

                    {/* Genres */}
                    {movie.genre && movie.genre.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {movie.genre.slice(0, 3).map((g) => (
                          <span key={g} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-gray-400 font-medium">
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button className="w-full mt-4 py-2 bg-indigo-600/10 group-hover:bg-indigo-600 text-indigo-300 group-hover:text-white border border-indigo-500/20 group-hover:border-indigo-600 rounded-xl text-xs font-bold transition-all shadow-md">
                    Book Tickets
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination?.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12 border-t border-slate-900 pt-6">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${p === page ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-900 border border-slate-800 text-gray-400 hover:text-white"}`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={page === pagination.totalPages}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
