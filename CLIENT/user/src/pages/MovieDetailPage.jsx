import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function MovieDetailPage() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);

  useEffect(() => {
    const load = async () => {
      const movieRes = await axios.get(
        `http://localhost:5000/api/movies/${movieId}`,
        { headers: { "access-token": localStorage.getItem("token") } },
      );
      setMovie(movieRes.data.data);
      const showsRes = await axios.get("http://localhost:5000/api/shows", {
        headers: { "access-token": localStorage.getItem("token") },
        params: { movieId },
      });
      setShows(showsRes.data.data || []);
    };
    load();
  }, [movieId]);

  if (!movie) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold">{movie.title}</h2>
      <p className="mt-2 text-gray-200">{movie.description}</p>
      <div className="mt-4">
        <h3 className="text-lg font-medium">Available Shows</h3>
        {shows.map((show) => (
          <div
            key={show._id}
            className="bg-slate-800 p-3 rounded-lg mb-2 flex justify-between items-center"
          >
            <div className="text-sm text-gray-300">
              {show.theatreId?.name || "Theatre"} •{" "}
              {new Date(show.showTime).toLocaleString()}
            </div>
            <button
              onClick={() => navigate(`/seat/${show._id}`)}
              className="px-3 py-1 rounded bg-indigo-600"
            >
              Book Seats
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
