import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createShow } from "../../redux/slices/showSlice";
import { fetchMovies } from "../../redux/slices/movieSlice";
import { toast } from "react-toastify";
import api from "../../services/api";

export default function ShowForm({ onClose, onSuccess }) {
  const dispatch = useDispatch();
  const { movies } = useSelector((state) => state.movies);
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    movieId: "",
    theatreId: "",
    screenNumber: "",
    showTime: "",
    showDate: "",
    totalRows: 12,
  });

  // Fetch movies and theatres on mount
  useEffect(() => {
    dispatch(fetchMovies({}));
    fetchTheatres();
  }, [dispatch]);

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
    setLoading(true);

    try {
      // Validate required fields
      if (
        !formData.movieId ||
        !formData.theatreId ||
        !formData.screenNumber ||
        !formData.showTime ||
        !formData.showDate
      ) {
        toast.error("Please fill all required fields");
        setLoading(false);
        return;
      }

      await dispatch(createShow(formData)).unwrap();
      toast.success("Show created successfully!");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(error || "Failed to create show");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-6">🎭 Create New Show</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Movie Selection */}
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Select Movie *
          </label>
          <select
            name="movieId"
            value={formData.movieId}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none transition"
            required
          >
            <option value="">-- Select a movie --</option>
            {movies.map((movie) => (
              <option key={movie._id || movie.id} value={movie._id || movie.id}>
                {movie.title}
              </option>
            ))}
          </select>
        </div>

        {/* Theatre Selection */}
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Select Theatre *
          </label>
          <select
            name="theatreId"
            value={formData.theatreId}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none transition"
            required
          >
            <option value="">-- Select a theatre --</option>
            {theatres.map((theatre) => (
              <option
                key={theatre._id || theatre.id}
                value={theatre._id || theatre.id}
              >
                {theatre.name}
              </option>
            ))}
          </select>
        </div>

        {/* Screen Number */}
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Screen Number *
          </label>
          <input
            type="number"
            name="screenNumber"
            value={formData.screenNumber}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none transition"
            placeholder="1"
            min="1"
            required
          />
        </div>

        {/* Show Date */}
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Show Date *
          </label>
          <input
            type="date"
            name="showDate"
            value={formData.showDate}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none transition"
            required
          />
        </div>

        {/* Show Time */}
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Show Time *
          </label>
          <input
            type="time"
            name="showTime"
            value={formData.showTime}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none transition"
            required
          />
        </div>

        {/* Total Rows */}
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Total Rows
          </label>
          <input
            type="number"
            name="totalRows"
            value={formData.totalRows}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none transition"
            min="1"
          />
          <p className="text-gray-400 text-xs mt-1">
            Default: 12 rows × 15 seats = 180 seats
          </p>
        </div>

        {/* Seat Categories Info */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-2">
          <p className="text-gray-300 text-sm font-bold">
            🎫 Automatic Seat Categories:
          </p>
          <div className="text-xs text-gray-400 space-y-1">
            <p>🌟 PREMIUM (Rows 5-7): ₹250</p>
            <p>⭐ STANDARD (Rows 3-8): ₹200</p>
            <p>✨ ECONOMY (Other Rows): ₹150</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-2 rounded transition font-bold text-white ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {loading ? "⏳ Creating..." : "Create Show"}
          </button>
        </div>
      </form>
    </div>
  );
}
