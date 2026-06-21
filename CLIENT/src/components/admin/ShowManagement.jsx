import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchShows, createShow } from "../../redux/slices/showSlice";
import { fetchMovies } from "../../redux/slices/movieSlice";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function ShowManagement() {
  const dispatch = useDispatch();
  const { shows, loading } = useSelector((state) => state.shows);
  const { movies } = useSelector((state) => state.movies);
  const [theatres, setTheatres] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    movieId: "",
    theatreId: "",
    screenNumber: 1,
    showTime: "",
    showDate: "",
    totalRows: 12,
    seatsPerRow: 15,
  });

  useEffect(() => {
    dispatch(fetchMovies({}));
    dispatch(fetchShows({}));
    fetchTheatres();
  }, []);

  const fetchTheatres = async () => {
    try {
      const response = await api.get("/api/theatres");
      setTheatres(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch theatres");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createShow(formData)).unwrap();
      toast.success("Show created successfully!");
      setShowForm(false);
      setFormData({
        movieId: "",
        theatreId: "",
        screenNumber: 1,
        showTime: "",
        showDate: "",
        totalRows: 12,
        seatsPerRow: 15,
      });
    } catch (error) {
      toast.error(error || "Failed to create show");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Show Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
        >
          {showForm ? "✕ Cancel" : "+ Add Show"}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                name="movieId"
                value={formData.movieId}
                onChange={handleChange}
                required
                className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none"
              >
                <option value="">Select Movie</option>
                {movies.map((movie) => (
                  <option key={movie.id} value={movie.id}>
                    {movie.title}
                  </option>
                ))}
              </select>
              <select
                name="theatreId"
                value={formData.theatreId}
                onChange={handleChange}
                required
                className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none"
              >
                <option value="">Select Theatre</option>
                {theatres.map((theatre) => (
                  <option key={theatre.id} value={theatre.id}>
                    {theatre.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="screenNumber"
                placeholder="Screen Number"
                value={formData.screenNumber}
                onChange={handleChange}
                className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none"
              />
              <input
                type="datetime-local"
                name="showTime"
                value={formData.showTime}
                onChange={handleChange}
                required
                className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none"
              />
              <input
                type="date"
                name="showDate"
                value={formData.showDate}
                onChange={handleChange}
                required
                className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none"
              />
              <input
                type="number"
                name="totalRows"
                placeholder="Total Rows"
                value={formData.totalRows}
                onChange={handleChange}
                className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded transition"
            >
              Create Show
            </button>
          </form>
        </div>
      )}

      <div className="overflow-x-auto bg-gray-900 border border-gray-700 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-800 border-b border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-white">Movie</th>
              <th className="px-6 py-3 text-left text-white">Theatre</th>
              <th className="px-6 py-3 text-left text-white">Screen</th>
              <th className="px-6 py-3 text-left text-white">Show Time</th>
              <th className="px-6 py-3 text-left text-white">Date</th>
              <th className="px-6 py-3 text-left text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {shows.map((show) => (
              <tr key={show.id} className="hover:bg-gray-800 transition">
                <td className="px-6 py-4 text-white">{show.movieId?.title}</td>
                <td className="px-6 py-4 text-white">{show.theatreId?.name}</td>
                <td className="px-6 py-4 text-white">{show.screenNumber}</td>
                <td className="px-6 py-4 text-white">
                  {new Date(show.showTime).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-white">
                  {new Date(show.showDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 flex gap-2">
                  <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm">
                    Edit
                  </button>
                  <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
