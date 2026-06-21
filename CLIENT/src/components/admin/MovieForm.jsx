import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  createMovie,
  updateMovie,
  uploadBanner,
} from "../../redux/slices/movieSlice";
import { toast } from "react-toastify";
import FileUpload from "../common/FileUpload";

export default function MovieForm({ movie = null, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(movie?.banner || null);
  const [formData, setFormData] = useState({
    title: movie?.title || "",
    description: movie?.description || "",
    duration: movie?.duration || "",
    genre: movie?.genre || [],
    language: movie?.language || "English",
    censorRating: movie?.censorRating || "UA",
    trailerUrl: movie?.trailerUrl || "",
    rating: movie?.rating || 0,
  });

  // Handle file selection
  const handleFileSelect = (file) => {
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBannerPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setBannerFile(null);
      setBannerPreview(movie?.banner || null);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle genre changes
  const handleGenreChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      genre: checked
        ? [...prev.genre, value]
        : prev.genre.filter((g) => g !== value),
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.description || !formData.duration) {
        toast.error("Please fill all required fields");
        setLoading(false);
        return;
      }

      if (movie) {
        // Update existing movie
        await dispatch(
          updateMovie({
            id: movie._id,
            data: formData,
          }),
        ).unwrap();

        // Upload banner if selected
        if (bannerFile) {
          const bannerFormData = new FormData();
          bannerFormData.append("banner", bannerFile);
          await dispatch(
            uploadBanner({
              movieId: movie._id,
              file: bannerFile,
            }),
          ).unwrap();
        }

        toast.success("Movie updated successfully!");
      } else {
        // Create new movie
        const result = await dispatch(createMovie(formData)).unwrap();

        // Upload banner if selected
        if (bannerFile) {
          await dispatch(
            uploadBanner({
              movieId: result._id,
              file: bannerFile,
            }),
          ).unwrap();
        }

        toast.success("Movie created successfully!");
      }

      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(
        error || (movie ? "Failed to update movie" : "Failed to create movie"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
      <h2 className="text-2xl font-bold text-white mb-6">
        {movie ? "✏️ Edit Movie" : "➕ Add New Movie"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Banner Upload */}
        <FileUpload
          label="Movie Banner/Poster"
          onFileSelect={handleFileSelect}
          preview={bannerPreview}
          accept="image/*"
          maxSize={5}
        />

        {/* Title */}
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none transition"
            placeholder="Movie title"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none transition resize-none"
            placeholder="Movie description"
            required
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Duration (minutes) *
          </label>
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none transition"
            placeholder="120"
            required
          />
        </div>

        {/* Language */}
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Language
          </label>
          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none transition"
          >
            <option>English</option>
            <option>Hindi</option>
            <option>Tamil</option>
            <option>Telugu</option>
            <option>Kannada</option>
            <option>Malayalam</option>
          </select>
        </div>

        {/* Censor Rating */}
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Censor Rating
          </label>
          <select
            name="censorRating"
            value={formData.censorRating}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none transition"
          >
            <option value="U">U (Unrestricted)</option>
            <option value="UA">UA (Unrestricted with parental guidance)</option>
            <option value="A">A (Restricted to adults)</option>
            <option value="S">S (Restricted to specialized audiences)</option>
          </select>
        </div>

        {/* Genre */}
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Genres
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              "Action",
              "Comedy",
              "Drama",
              "Horror",
              "Romance",
              "Thriller",
              "Sci-Fi",
              "Animation",
            ].map((g) => (
              <label key={g} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={g}
                  checked={formData.genre.includes(g)}
                  onChange={handleGenreChange}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-gray-300 text-sm">{g}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Rating (IMDb)
          </label>
          <input
            type="number"
            name="rating"
            value={formData.rating}
            onChange={handleChange}
            min="0"
            max="10"
            step="0.1"
            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none transition"
            placeholder="7.5"
          />
        </div>

        {/* Trailer URL */}
        <div>
          <label className="block text-gray-300 text-sm font-bold mb-2">
            Trailer URL
          </label>
          <input
            type="url"
            name="trailerUrl"
            value={formData.trailerUrl}
            onChange={handleChange}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-red-600 outline-none transition"
            placeholder="https://youtube.com/watch?v=..."
          />
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
            {loading
              ? "⏳ Saving..."
              : movie
                ? "💾 Update Movie"
                : "➕ Create Movie"}
          </button>
        </div>
      </form>
    </div>
  );
}
