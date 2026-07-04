import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchMovies } from "../slices/movieSlice";

export default function MoviesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { movies, loading, pagination } = useSelector((state) => state.movies);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchMovies({ page }));
  }, [dispatch, page]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold">Movies</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4 mt-3">
          {movies.map((movie) => (
            <div
              key={movie._id}
              className="bg-slate-800 p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-medium">{movie.title}</h3>
                <div className="text-sm text-gray-400">
                  {movie.language} • {movie.duration} min
                </div>
              </div>
              <button
                onClick={() => navigate(`/movie/${movie._id}`)}
                className="px-3 py-2 rounded bg-indigo-600"
              >
                View & Book
              </button>
            </div>
          ))}
        </div>
      )}
      {pagination?.totalPages > 1 && (
        <div className="mt-4">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="mr-2 px-3 py-1 rounded bg-gray-600"
              >
                {p}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
