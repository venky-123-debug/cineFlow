import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMovies } from "../../redux/slices/movieSlice";
// import { fetchMovies, deleteMovie } from "../../redux/slices/movieSlice";
import { toast } from "react-toastify";
import MovieForm from "./MovieForm";

export default function MovieManagement() {
  const dispatch = useDispatch();
  const { movies, loading } = useSelector((state) => state.movies);
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);

  React.useEffect(() => {
    dispatch(fetchMovies({}));
  }, [dispatch]);

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMovie(null);
  };

  const handleFormSuccess = () => {
    dispatch(fetchMovies({}));
    handleCloseForm();
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setShowForm(true);
  };

  const handleDelete = async (movieId) => {
    if (!window.confirm("Are you sure you want to delete this movie?")) return;

    try {
      // await dispatch(deleteMovie(movieId)).unwrap();
      toast.success("Movie deleted successfully!");
      dispatch(fetchMovies({}));
    } catch (error) {
      toast.error(error || "Failed to delete movie");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">🎬 Movie Management</h1>
        <button
          onClick={() => {
            setEditingMovie(null);
            setShowForm(!showForm);
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition font-bold"
        >
          {showForm ? "✕ Cancel" : "➕ Add Movie"}
        </button>
      </div>

      {/* Movie Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <MovieForm
            movie={editingMovie}
            onClose={handleCloseForm}
            onSuccess={handleFormSuccess}
          />
        </div>
      )}

      {/* Movies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-400">
            ⏳ Loading movies...
          </div>
        ) : movies.length === 0 ? (
          <div className="col-span-full text-center text-gray-400">
            📭 No movies found
          </div>
        ) : (
          movies.map((movie) => (
            <div
              key={movie._id || movie.id}
              className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden hover:border-red-600 hover:shadow-2xl hover:shadow-red-600/50 transition group"
            >
              {/* Banner Image */}
              <div className="relative h-48 overflow-hidden bg-gray-800">
                {movie.banner ? (
                  <img
                    src={movie.banner}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    📷 No Image
                  </div>
                )}
                {/* Rating Badge */}
                {movie.rating && (
                  <div className="absolute top-2 right-2 bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    ⭐ {movie.rating}
                  </div>
                )}
                {/* Censor Rating */}
                {movie.censorRating && (
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                    {movie.censorRating}
                  </div>
                )}
              </div>

              {/* Movie Info */}
              <div className="p-4 space-y-3">
                <h3 className="text-white font-bold text-lg line-clamp-2">
                  {movie.title}
                </h3>

                {/* Duration & Language */}
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>⏱️ {movie.duration} min</span>
                  <span>🌐 {movie.language}</span>
                </div>

                {/* Genres */}
                {movie.genre && movie.genre.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {movie.genre.slice(0, 2).map((g) => (
                      <span
                        key={g}
                        className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs"
                      >
                        {g}
                      </span>
                    ))}
                    {movie.genre.length > 2 && (
                      <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">
                        +{movie.genre.length - 2} more
                      </span>
                    )}
                  </div>
                )}

                {/* Description */}
                <p className="text-gray-300 text-sm line-clamp-2">
                  {movie.description}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleEdit(movie)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm transition font-bold"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(movie._id || movie.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm transition font-bold"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
