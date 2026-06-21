import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchMovies } from "../../redux/slices/movieSlice";
import { fetchShows } from "../../redux/slices/showSlice";
import api from "../../services/api";

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { movies } = useSelector((state) => state.movies);
  const { shows } = useSelector((state) => state.shows);
  const [stats, setStats] = useState({ totalBookings: 0, totalRevenue: 0 });

  useEffect(() => {
    dispatch(fetchMovies({}));
    dispatch(fetchShows({}));
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get("/api/bookings/stats");
      setStats(response.data.data || { totalBookings: 0, totalRevenue: 0 });
    } catch (error) {
      console.error("Failed to fetch stats");
    }
  };

  const statCards = [
    {
      title: "Total Movies",
      value: movies.length,
      icon: "🎬",
      color: "from-blue-600 to-blue-800",
    },
    {
      title: "Active Shows",
      value: shows.length,
      icon: "🎭",
      color: "from-purple-600 to-purple-800",
    },
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      icon: "🎫",
      color: "from-green-600 to-green-800",
    },
    {
      title: "Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: "💰",
      color: "from-yellow-600 to-yellow-800",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${card.color} rounded-lg p-6 text-white shadow-lg hover:shadow-xl transition`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-200 text-sm mb-2">{card.title}</p>
                <p className="text-3xl font-bold">{card.value}</p>
              </div>
              <span className="text-4xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-red-600 hover:bg-red-700 text-white py-3 rounded transition">
            📽️ Add New Movie
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white py-3 rounded transition">
            🎭 Create Show
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white py-3 rounded transition">
            📊 View Analytics
          </button>
        </div>
      </div>

      {/* Recent Movies */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Recent Movies</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {movies.slice(0, 4).map((movie) => (
            <div
              key={movie.id}
              className="bg-gray-800 rounded-lg overflow-hidden hover:border-red-600 border border-gray-700 transition"
            >
              {movie.banner && (
                <img
                  src={movie.banner}
                  alt={movie.title}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-3">
                <p className="text-white font-bold text-sm truncate">
                  {movie.title}
                </p>
                <p className="text-gray-400 text-xs">{movie.language}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
