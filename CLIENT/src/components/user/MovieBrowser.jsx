import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMovies } from "../../redux/slices/movieSlice";
import { useNavigate } from "react-router-dom";

export default function MovieBrowser() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { movies, loading } = useSelector((state) => state.movies);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchMovies({}));
  }, []);

  const filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-12 mb-8 text-white">
        <h1 className="text-4xl font-bold mb-2">🎬 Now Showing</h1>
        <p className="text-lg opacity-90">
          Book your favorite movies and enjoy premium experience
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="🔍 Search movies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-800 text-white px-6 py-3 rounded-lg border border-gray-700 focus:border-red-600 outline-none"
        />
      </div>

      {/* Movies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-400">
            Loading movies...
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="col-span-full text-center text-gray-400">
            No movies found
          </div>
        ) : (
          filteredMovies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => navigate(`/user/movie/${movie.id}`)}
              className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden hover:border-red-600 hover:shadow-2xl hover:shadow-red-600/50 transition duration-300 cursor-pointer group"
            >
              <div className="relative h-64 overflow-hidden">
                {movie.banner && (
                  <img
                    src={movie.banner}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                )}
                <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                  {movie.censorRating}
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
                  {movie.title}
                </h3>
                <p className="text-gray-400 text-sm mb-3 flex justify-between">
                  <span>⏱️ {movie.duration} min</span>
                  <span>🌐 {movie.language}</span>
                </p>
                <p className="text-gray-300 text-sm line-clamp-2 mb-4">
                  {movie.description}
                </p>
                <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded transition font-bold">
                  Book Now
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
