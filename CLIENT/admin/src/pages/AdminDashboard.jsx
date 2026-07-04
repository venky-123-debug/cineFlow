import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import Header from "../components/Header";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  // Tab State: "dashboard", "movies", "theatres", "shows", "bookings"
  const [activeTab, setActiveTab] = useState("dashboard");

  // Common Loading & Error States
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Data States
  const [stats, setStats] = useState(null);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Form States (Modal)
  const [showModal, setShowModal] = useState(false); // false, "addMovie", "editMovie", "addTheatre", "editTheatre", "addShow", "editShow"
  const [currentEditId, setCurrentEditId] = useState("");
  
  // Modal Payload templates
  const [movieForm, setMovieForm] = useState({
    title: "",
    description: "",
    duration: 120,
    genre: "",
    poster: "",
    banner: "",
    trailerUrl: "",
    rating: 8,
    releaseDate: "",
    language: "English",
    censorRating: "UA",
  });

  const [theatreForm, setTheatreForm] = useState({
    name: "",
    location: "",
    city: "",
    totalSeats: 150,
    screens: 1,
    amenities: "",
  });

  const [showForm, setShowForm] = useState({
    movieId: "",
    theatreId: "",
    screenNumber: 1,
    showTime: "",
    showDate: "",
    price: 200,
    availableSeats: 150,
  });

  // Check auth - must be Admin
  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      navigate("/login");
    }
  }, [user, navigate]);

  // Load Data based on Active Tab
  const loadData = async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");
    const token = localStorage.getItem("token");

    try {
      if (activeTab === "dashboard") {
        const statsRes = await axios.get(
          "http://localhost:5000/api/bookings/stats",
          {
            headers: { "access-token": token },
          },
        );
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
      } else if (activeTab === "movies") {
        const moviesRes = await axios.get("http://localhost:5000/api/movies", {
          headers: { "access-token": token },
          params: { limit: 100 },
        });
        if (moviesRes.data.success) {
          setMovies(moviesRes.data.data.movies || []);
        }
      } else if (activeTab === "theatres") {
        const theatresRes = await axios.get(
          "http://localhost:5000/api/theatres",
          {
            headers: { "access-token": token },
            params: { limit: 100 },
          },
        );
        if (theatresRes.data.success) {
          setTheatres(theatresRes.data.data.data || []);
        }
      } else if (activeTab === "shows") {
        const [showsRes, moviesRes, theatresRes] = await Promise.all([
          axios.get("http://localhost:5000/api/shows", {
            headers: { "access-token": token },
          }),
          axios.get("http://localhost:5000/api/movies", {
            headers: { "access-token": token },
            params: { limit: 100 },
          }),
          axios.get("http://localhost:5000/api/theatres", {
            headers: { "access-token": token },
            params: { limit: 100 },
          }),
        ]);

        if (showsRes.data.success) setShows(showsRes.data.data || []);
        if (moviesRes.data.success) setMovies(moviesRes.data.data.movies || []);
        if (theatresRes.data.success)
          setTheatres(theatresRes.data.data.data || []);
      } else if (activeTab === "bookings") {
        const bookingsRes = await axios.get(
          "http://localhost:5000/api/bookings",
          {
            headers: { "access-token": token },
            params: { limit: 100 },
          },
        );
        if (bookingsRes.data.success) {
          setBookings(bookingsRes.data.data.bookings || []);
        }
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || `Failed to fetch data for ${activeTab}`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadData();
    }
  }, [activeTab]);

  // Handle Deletions
  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`))
      return;
    setActionLoading(true);
    const token = localStorage.getItem("token");
    try {
      let url = "";
      if (type === "movie") url = `http://localhost:5000/api/movies/${id}`;
      if (type === "theatre") url = `http://localhost:5000/api/theatres/${id}`;
      if (type === "show") url = `http://localhost:5000/api/shows/${id}`;

      const res = await axios.delete(url, {
        headers: { "access-token": token },
      });
      if (res.data.success) {
        setSuccessMsg(`${type.toUpperCase()} deleted successfully.`);
        loadData();
      } else {
        setError(res.data.message || `Failed to delete ${type}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to delete ${type}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Movie Form (Add / Edit)
  const handleMovieSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const payload = {
        ...movieForm,
        genre: movieForm.genre
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
      };

      let res;
      if (showModal === "addMovie") {
        res = await axios.post("http://localhost:5000/api/movies", payload, {
          headers: { "access-token": token },
        });
      } else {
        res = await axios.patch(
          `http://localhost:5000/api/movies/${currentEditId}`,
          payload,
          {
            headers: { "access-token": token },
          },
        );
      }

      if (res.data.success) {
        setSuccessMsg(
          showModal === "addMovie"
            ? "Movie created successfully."
            : "Movie updated successfully.",
        );
        setShowModal(false);
        loadData();
      } else {
        setError(res.data.message || "Operation failed.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Theatre Form (Add / Edit)
  const handleTheatreSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const payload = {
        ...theatreForm,
        amenities: theatreForm.amenities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      };

      let res;
      if (showModal === "addTheatre") {
        res = await axios.post("http://localhost:5000/api/theatres", payload, {
          headers: { "access-token": token },
        });
      } else {
        res = await axios.patch(
          `http://localhost:5000/api/theatres/${currentEditId}`,
          payload,
          {
            headers: { "access-token": token },
          },
        );
      }

      if (res.data.success) {
        setSuccessMsg(
          showModal === "addTheatre"
            ? "Theatre created successfully."
            : "Theatre updated successfully.",
        );
        setShowModal(false);
        loadData();
      } else {
        setError(res.data.message || "Operation failed.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Show Form (Add / Edit)
  const handleShowSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const payload = {
        ...showForm,
        showTime: `${showForm.showDate}T${showForm.showTime}:00`,
      };

      let res;
      if (showModal === "addShow") {
        res = await axios.post("http://localhost:5000/api/shows", payload, {
          headers: { "access-token": token },
        });
      } else {
        res = await axios.patch(
          `http://localhost:5000/api/shows/${currentEditId}`,
          payload,
          {
            headers: { "access-token": token },
          },
        );
      }

      if (res.data.success) {
        setSuccessMsg(
          showModal === "addShow"
            ? "Show created successfully."
            : "Show updated successfully.",
        );
        setShowModal(false);
        loadData();
      } else {
        setError(res.data.message || "Operation failed.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  // Edit Initiators
  const initMovieEdit = (movie) => {
    setMovieForm({
      title: movie.title || "",
      description: movie.description || "",
      duration: movie.duration || 120,
      genre: movie.genre?.join(", ") || "",
      poster: movie.poster || "",
      banner: movie.banner || "",
      trailerUrl: movie.trailerUrl || "",
      rating: movie.rating || 8,
      releaseDate: movie.releaseDate ? movie.releaseDate.split("T")[0] : "",
      language: movie.language || "English",
      censorRating: movie.censorRating || "UA",
    });
    setCurrentEditId(movie.id);
    setShowModal("editMovie");
  };

  const initTheatreEdit = (theatre) => {
    setTheatreForm({
      name: theatre.name || "",
      location: theatre.location || "",
      city: theatre.city || "",
      totalSeats: theatre.totalSeats || 150,
      screens: theatre.screens || 1,
      amenities: theatre.amenities?.join(", ") || "",
    });
    setCurrentEditId(theatre.id);
    setShowModal("editTheatre");
  };

  const initShowEdit = (show) => {
    const showTimeObj = new Date(show.showTime);
    const dateStr = show.showDate
      ? show.showDate.split("T")[0]
      : showTimeObj.toISOString().split("T")[0];
    const timeStr = showTimeObj.toTimeString().substring(0, 5); // HH:MM

    setShowForm({
      movieId: show.movieId?.id || show.movieId?._id || "",
      theatreId: show.theatreId?.id || show.theatreId?._id || "",
      screenNumber: show.screenNumber || 1,
      showTime: timeStr,
      showDate: dateStr,
      price: show.price || 200,
      availableSeats: show.availableSeats || 150,
    });
    setCurrentEditId(show.id);
    setShowModal("editShow");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Header />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-6 py-8 gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-[220px] shrink-0 flex flex-col gap-2">
          <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-600/5 mb-4 text-center">
            <span className="text-xs text-gray-500 font-bold uppercase block">
              Workspace Role
            </span>
            <span className="text-sm font-black text-amber-400 mt-0.5 block uppercase tracking-wide">
              ADMIN CONTROL
            </span>
          </div>

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full text-left px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
              activeTab === "dashboard"
                ? "bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                : "bg-slate-900/60 border-slate-850 text-gray-400 hover:text-white"
            }`}
          >
            Dashboard Stats
          </button>
          
          <button
            onClick={() => setActiveTab("movies")}
            className={`w-full text-left px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
              activeTab === "movies"
                ? "bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                : "bg-slate-900/60 border-slate-850 text-gray-400 hover:text-white"
            }`}
          >
            Manage Movies
          </button>
          
          <button
            onClick={() => setActiveTab("theatres")}
            className={`w-full text-left px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
              activeTab === "theatres"
                ? "bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                : "bg-slate-900/60 border-slate-850 text-gray-400 hover:text-white"
            }`}
          >
            Manage Theatres
          </button>
          
          <button
            onClick={() => setActiveTab("shows")}
            className={`w-full text-left px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
              activeTab === "shows"
                ? "bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                : "bg-slate-900/60 border-slate-850 text-gray-400 hover:text-white"
            }`}
          >
            Manage Shows
          </button>
          
          <button
            onClick={() => setActiveTab("bookings")}
            className={`w-full text-left px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
              activeTab === "bookings"
                ? "bg-amber-500 border-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                : "bg-slate-900/60 border-slate-850 text-gray-400 hover:text-white"
            }`}
          >
            Ticket Ledger
          </button>
        </aside>

        {/* Workspace content section */}
        <main className="flex-1 min-w-0 bg-slate-900/20 border border-slate-850 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          {/* Header row */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-900 pb-4 mb-6 gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-wide uppercase">
                  Admin Panel / {activeTab}
                </h2>
                <p className="text-xs text-gray-500 font-bold uppercase mt-0.5 tracking-wider">
                  Update database assets and visualize business transactions
                </p>
              </div>

              {/* Action Buttons for CRUD additions */}
              {activeTab === "movies" && (
                <button
                  onClick={() => {
                    setMovieForm({
                      title: "",
                      description: "",
                      duration: 120,
                      genre: "",
                      poster: "",
                      banner: "",
                      trailerUrl: "",
                      rating: 8,
                      releaseDate: "",
                      language: "English",
                      censorRating: "UA",
                    });
                    setShowModal("addMovie");
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-lg"
                >
                  + Add Movie
                </button>
              )}
              {activeTab === "theatres" && (
                <button
                  onClick={() => {
                    setTheatreForm({
                      name: "",
                      location: "",
                      city: "",
                      totalSeats: 150,
                      screens: 1,
                      amenities: "",
                    });
                    setShowModal("addTheatre");
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-lg"
                >
                  + Add Theatre
                </button>
              )}
              {activeTab === "shows" && (
                <button
                  onClick={() => {
                    setShowForm({
                      movieId: movies[0]?.id || "",
                      theatreId: theatres[0]?.id || "",
                      screenNumber: 1,
                      showTime: "18:00",
                      showDate: new Date().toISOString().split("T")[0],
                      price: 200,
                      availableSeats: theatres[0]?.totalSeats || 150,
                    });
                    setShowModal("addShow");
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-lg"
                >
                  + Add Show
                </button>
              )}
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="p-3 mb-6 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="p-3 mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400">
                {successMsg}
              </div>
            )}

            {/* Lazy loader spinner */}
            {loading ? (
              <div className="py-20 flex justify-center">
                <svg
                  className="animate-spin h-10 w-10 text-amber-500"
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
            ) : (
              <>
                {/* 1. DASHBOARD TAB */}
                {activeTab === "dashboard" && stats && (
                  <div className="space-y-8">
                    {/* Cards grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-855 flex items-center justify-between shadow-md">
                        <div>
                          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">
                            Total Bookings
                          </span>
                          <span className="text-3xl font-black text-amber-400 block mt-1.5">
                            {stats.totalBookings}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/10">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                            ></path>
                          </svg>
                        </div>
                      </div>

                      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-855 flex items-center justify-between shadow-md">
                        <div>
                          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">
                            Platform Revenue
                          </span>
                          <span className="text-3xl font-black text-emerald-400 block mt-1.5">
                            ₹{stats.totalRevenue}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1M10 11h2.5"
                            ></path>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Recent Bookings */}
                    <div className="space-y-4">
                      <h3 className="text-base font-bold tracking-wide border-l-4 border-amber-500 pl-3">
                        Recent Confirmations
                      </h3>

                      {stats.recentBookings?.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">
                          No bookings recorded yet.
                        </p>
                      ) : (
                        <div className="overflow-x-auto border border-slate-900 rounded-xl">
                          <table className="w-full text-xs text-left text-gray-400">
                            <thead className="bg-slate-950 text-white font-bold uppercase text-[10px] tracking-wider border-b border-slate-900">
                              <tr>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Movie</th>
                                <th className="p-4">Seats</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4 text-right">Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stats.recentBookings.map((b) => (
                                <tr
                                  key={b.id}
                                  className="border-b border-slate-900 hover:bg-slate-900/40"
                                >
                                  <td className="p-4 font-semibold text-gray-200">
                                    {b.userId?.name || "N/A"} <br />
                                    <span className="text-[10px] text-gray-500 font-normal">
                                      {b.userId?.email}
                                    </span>
                                  </td>
                                  <td className="p-4 font-semibold text-gray-300">
                                    {b.showId?.movieId?.title || "Movie Show"}{" "}
                                    <br />
                                    <span className="text-[10px] text-gray-500 font-normal">
                                      {b.showId?.theatreId?.name}
                                    </span>
                                  </td>
                                  <td className="p-4 font-bold text-amber-400 uppercase">
                                    {b.seats?.join(", ")}
                                  </td>
                                  <td className="p-4 font-black text-emerald-400">
                                    ₹{b.totalAmount}
                                  </td>
                                  <td className="p-4 text-right">
                                    {new Date(b.createdAt).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. MOVIES TAB */}
                {activeTab === "movies" && (
                  <div className="space-y-4">
                    {movies.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">
                        No movies available in the database.
                      </p>
                    ) : (
                      <div className="overflow-x-auto border border-slate-900 rounded-xl">
                        <table className="w-full text-xs text-left text-gray-400">
                          <thead className="bg-slate-950 text-white font-bold uppercase text-[10px] tracking-wider border-b border-slate-900">
                            <tr>
                              <th className="p-4">Movie</th>
                              <th className="p-4">Info</th>
                              <th className="p-4">Genres</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {movies.map((movie) => (
                              <tr
                                key={movie.id}
                                className="border-b border-slate-900 hover:bg-slate-900/40"
                              >
                                <td className="p-4 font-semibold text-gray-200 flex items-center gap-3">
                                  {movie.poster && (
                                    <img
                                      src={
                                        movie.poster.startsWith("http")
                                          ? movie.poster
                                          : `http://localhost:5000${movie.poster}`
                                      }
                                      alt=""
                                      className="w-8 aspect-2/3 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <span className="text-sm font-bold text-white block">
                                      {movie.title}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-bold block uppercase">
                                      {movie.censorRating || "UA"}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="text-gray-300 font-semibold">
                                    {movie.language}
                                  </span>{" "}
                                  <br />
                                  <span className="text-[10px] text-gray-500 block mt-0.5">
                                    {movie.duration} Mins
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="flex flex-wrap gap-1">
                                    {movie.genre?.map((g) => (
                                      <span
                                        key={g}
                                        className="text-[10px] px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-gray-400"
                                      >
                                        {g}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                  <button
                                    onClick={() => initMovieEdit(movie)}
                                    className="px-2.5 py-1 text-[10px] bg-slate-850 hover:bg-slate-800 border border-slate-800 text-amber-400 rounded-md font-bold"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    disabled={actionLoading}
                                    onClick={() =>
                                      handleDelete("movie", movie.id)
                                    }
                                    className="px-2.5 py-1 text-[10px] bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 rounded-md font-bold disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. THEATRES TAB */}
                {activeTab === "theatres" && (
                  <div className="space-y-4">
                    {theatres.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">
                        No theatres available in the database.
                      </p>
                    ) : (
                      <div className="overflow-x-auto border border-slate-900 rounded-xl">
                        <table className="w-full text-xs text-left text-gray-400">
                          <thead className="bg-slate-950 text-white font-bold uppercase text-[10px] tracking-wider border-b border-slate-900">
                            <tr>
                              <th className="p-4">Theatre</th>
                              <th className="p-4">City</th>
                              <th className="p-4">Capacity</th>
                              <th className="p-4">Screens</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {theatres.map((theatre) => (
                              <tr
                                key={theatre.id}
                                className="border-b border-slate-900 hover:bg-slate-900/40"
                              >
                                <td className="p-4 font-semibold text-gray-200">
                                  {theatre.name} <br />
                                  <span className="text-[10px] text-gray-500 font-normal mt-0.5 block">
                                    {theatre.location}
                                  </span>
                                </td>
                                <td className="p-4 font-bold text-gray-300">
                                  {theatre.city}
                                </td>
                                <td className="p-4 font-bold text-indigo-400">
                                  {theatre.totalSeats} seats
                                </td>
                                <td className="p-4 font-semibold text-gray-300">
                                  {theatre.screens || 1} screens
                                </td>
                                <td className="p-4 text-right space-x-2">
                                  <button
                                    onClick={() => initTheatreEdit(theatre)}
                                    className="px-2.5 py-1 text-[10px] bg-slate-850 hover:bg-slate-800 border border-slate-800 text-amber-400 rounded-md font-bold"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    disabled={actionLoading}
                                    onClick={() =>
                                      handleDelete("theatre", theatre.id)
                                    }
                                    className="px-2.5 py-1 text-[10px] bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 rounded-md font-bold disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. SHOWS TAB */}
                {activeTab === "shows" && (
                  <div className="space-y-4">
                    {shows.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">
                        No shows scheduled in the database.
                      </p>
                    ) : (
                      <div className="overflow-x-auto border border-slate-900 rounded-xl">
                        <table className="w-full text-xs text-left text-gray-400">
                          <thead className="bg-slate-950 text-white font-bold uppercase text-[10px] tracking-wider border-b border-slate-900">
                            <tr>
                              <th className="p-4">Movie</th>
                              <th className="p-4">Theatre</th>
                              <th className="p-4">Schedule</th>
                              <th className="p-4">Price</th>
                              <th className="p-4">Available</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {shows.map((show) => {
                              const showTime = new Date(show.showTime);
                              return (
                                <tr
                                  key={show.id}
                                  className="border-b border-slate-900 hover:bg-slate-900/40"
                                >
                                  <td className="p-4 font-bold text-white">
                                    {show.movieId?.title || "Movie Show"}
                                  </td>
                                  <td className="p-4 font-semibold text-gray-300">
                                    {show.theatreId?.name || "Theatre"} <br />
                                    <span className="text-[10px] text-gray-500 font-normal">
                                      Aud. {show.screenNumber || 1} •{" "}
                                      {show.theatreId?.city}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <span className="text-gray-300">
                                      {showTime.toLocaleDateString()}
                                    </span>{" "}
                                    <br />
                                    <span className="text-indigo-400 font-black text-[10px] block mt-0.5 uppercase">
                                      {showTime.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </td>
                                  <td className="p-4 font-bold text-gray-200">
                                    ₹{show.price || 200}
                                  </td>
                                  <td className="p-4 font-bold text-emerald-400">
                                    {show.availableSeats} seats
                                  </td>
                                  <td className="p-4 text-right space-x-2">
                                    <button
                                      onClick={() => initShowEdit(show)}
                                      className="px-2.5 py-1 text-[10px] bg-slate-855 hover:bg-slate-800 border border-slate-800 text-amber-400 rounded-md font-bold"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      disabled={actionLoading}
                                      onClick={() =>
                                        handleDelete("show", show.id)
                                      }
                                      className="px-2.5 py-1 text-[10px] bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 rounded-md font-bold disabled:opacity-50"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. BOOKINGS TAB */}
                {activeTab === "bookings" && (
                  <div className="space-y-4">
                    {bookings.length === 0 ? (
                      <p className="text-xs text-gray-500 italic">
                        No bookings recorded yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto border border-slate-900 rounded-xl">
                        <table className="w-full text-xs text-left text-gray-400">
                          <thead className="bg-slate-950 text-white font-bold uppercase text-[10px] tracking-wider border-b border-slate-900">
                            <tr>
                              <th className="p-4">Customer</th>
                              <th className="p-4">Movie & Theatre</th>
                              <th className="p-4">Seats</th>
                              <th className="p-4">Amount</th>
                              <th className="p-4">Status</th>
                              <th className="p-4 text-right">Booking Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bookings.map((booking) => (
                              <tr
                                key={booking.id}
                                className="border-b border-slate-900 hover:bg-slate-900/40"
                              >
                                <td className="p-4 font-semibold text-gray-200">
                                  {booking.userId?.name || "N/A"} <br />
                                  <span className="text-[10px] text-gray-500 font-normal">
                                    {booking.userId?.email}
                                  </span>
                                </td>
                                <td className="p-4 font-semibold text-gray-300">
                                  {booking.showId?.movieId?.title ||
                                    "Movie Show"}{" "}
                                  <br />
                                  <span className="text-[10px] text-gray-500 font-normal">
                                    {booking.showId?.theatreId?.name}
                                  </span>
                                </td>
                                <td className="p-4 font-bold text-amber-400 uppercase">
                                  {booking.seats?.join(", ")}
                                </td>
                                <td className="p-4 font-black text-emerald-400">
                                  ₹{booking.totalAmount}
                                </td>
                                <td className="p-4">
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black border uppercase ${
                                      booking.status === "CONFIRM"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : booking.status === "CANCEL"
                                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    }`}
                                  >
                                    {booking.status}
                                  </span>
                                </td>
                                <td className="p-4 text-right text-[10px]">
                                  {new Date(
                                    booking.createdAt,
                                  ).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t border-slate-900 pt-4 mt-6 text-center text-[10px] text-gray-500 font-bold uppercase">
            CineFlow Admin Panel • Verified Security
          </div>
        </main>
      </div>

      {/* CRUD MODALS */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-855 pb-3 mb-4">
              <h3 className="text-base font-bold uppercase">
                {showModal.startsWith("add") ? "+ Create " : "✎ Edit "}
                {showModal.includes("Movie")
                  ? "Movie"
                  : showModal.includes("Theatre")
                    ? "Theatre"
                    : "Show"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* MOVIE FORM */}
            {(showModal === "addMovie" || showModal === "editMovie") && (
              <form onSubmit={handleMovieSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      required
                      value={movieForm.title}
                      onChange={(e) =>
                        setMovieForm({ ...movieForm, title: e.target.value })
                      }
                      placeholder="e.g. Inception"
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Language
                    </label>
                    <input
                      type="text"
                      required
                      value={movieForm.language}
                      onChange={(e) =>
                        setMovieForm({ ...movieForm, language: e.target.value })
                      }
                      placeholder="e.g. English"
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    rows="2"
                    value={movieForm.description}
                    onChange={(e) =>
                      setMovieForm({
                        ...movieForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter short storyline..."
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Duration (Min)
                    </label>
                    <input
                      type="number"
                      required
                      value={movieForm.duration}
                      onChange={(e) =>
                        setMovieForm({
                          ...movieForm,
                          duration: parseInt(e.target.value),
                        })
                      }
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Rating
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="10"
                      step="0.1"
                      value={movieForm.rating}
                      onChange={(e) =>
                        setMovieForm({
                          ...movieForm,
                          rating: parseFloat(e.target.value),
                        })
                      }
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Rating Board
                    </label>
                    <select
                      value={movieForm.censorRating}
                      onChange={(e) =>
                        setMovieForm({
                          ...movieForm,
                          censorRating: e.target.value,
                        })
                      }
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="U">U (Universal)</option>
                      <option value="UA">UA (Parental guidance)</option>
                      <option value="A">A (Adults only)</option>
                      <option value="S">S (Special category)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Genres (Comma separated)
                    </label>
                    <input
                      type="text"
                      required
                      value={movieForm.genre}
                      onChange={(e) =>
                        setMovieForm({ ...movieForm, genre: e.target.value })
                      }
                      placeholder="e.g. Action, Sci-Fi"
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Release Date
                    </label>
                    <input
                      type="date"
                      required
                      value={movieForm.releaseDate}
                      onChange={(e) =>
                        setMovieForm({
                          ...movieForm,
                          releaseDate: e.target.value,
                        })
                      }
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Poster URL
                  </label>
                  <input
                    type="text"
                    value={movieForm.poster}
                    onChange={(e) =>
                      setMovieForm({ ...movieForm, poster: e.target.value })
                    }
                    placeholder="e.g. https://domain.com/poster.jpg"
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Banner URL
                    </label>
                    <input
                      type="text"
                      value={movieForm.banner}
                      onChange={(e) =>
                        setMovieForm({ ...movieForm, banner: e.target.value })
                      }
                      placeholder="e.g. https://domain.com/banner.jpg"
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Trailer Youtube Link
                    </label>
                    <input
                      type="text"
                      value={movieForm.trailerUrl}
                      onChange={(e) =>
                        setMovieForm({
                          ...movieForm,
                          trailerUrl: e.target.value,
                        })
                      }
                      placeholder="e.g. https://youtube.com/..."
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 mt-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase disabled:opacity-50"
                >
                  {actionLoading ? "Saving details..." : "Save Movie"}
                </button>
              </form>
            )}

            {/* THEATRE FORM */}
            {(showModal === "addTheatre" || showModal === "editTheatre") && (
              <form onSubmit={handleTheatreSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={theatreForm.name}
                      onChange={(e) =>
                        setTheatreForm({ ...theatreForm, name: e.target.value })
                      }
                      placeholder="e.g. PVR Orion"
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={theatreForm.city}
                      onChange={(e) =>
                        setTheatreForm({ ...theatreForm, city: e.target.value })
                      }
                      placeholder="e.g. Bangalore"
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Location Address
                  </label>
                  <input
                    type="text"
                    required
                    value={theatreForm.location}
                    onChange={(e) =>
                      setTheatreForm({
                        ...theatreForm,
                        location: e.target.value,
                      })
                    }
                    placeholder="e.g. Malleswaram"
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Total Capacity
                    </label>
                    <input
                      type="number"
                      required
                      value={theatreForm.totalSeats}
                      onChange={(e) =>
                        setTheatreForm({
                          ...theatreForm,
                          totalSeats: parseInt(e.target.value),
                        })
                      }
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Auditoriums/Screens
                    </label>
                    <input
                      type="number"
                      required
                      value={theatreForm.screens}
                      onChange={(e) =>
                        setTheatreForm({
                          ...theatreForm,
                          screens: parseInt(e.target.value),
                        })
                      }
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Amenities (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={theatreForm.amenities}
                    onChange={(e) =>
                      setTheatreForm({
                        ...theatreForm,
                        amenities: e.target.value,
                      })
                    }
                    placeholder="e.g. AC, Parking, Food Court"
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 mt-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase disabled:opacity-50"
                >
                  {actionLoading ? "Saving details..." : "Save Theatre"}
                </button>
              </form>
            )}

            {/* SHOW FORM */}
            {(showModal === "addShow" || showModal === "editShow") && (
              <form onSubmit={handleShowSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Movie
                  </label>
                  <select
                    required
                    value={showForm.movieId}
                    onChange={(e) =>
                      setShowForm({ ...showForm, movieId: e.target.value })
                    }
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="" disabled>
                      Select Movie
                    </option>
                    {movies.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Theatre
                  </label>
                  <select
                    required
                    value={showForm.theatreId}
                    onChange={(e) => {
                      const selectedTh = theatres.find(
                        (t) => t.id === e.target.value,
                      );
                      setShowForm({
                        ...showForm,
                        theatreId: e.target.value,
                        availableSeats: selectedTh
                          ? selectedTh.totalSeats
                          : showForm.availableSeats,
                      });
                    }}
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="" disabled>
                      Select Theatre
                    </option>
                    {theatres.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Screen Number
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={showForm.screenNumber}
                      onChange={(e) =>
                        setShowForm({
                          ...showForm,
                          screenNumber: parseInt(e.target.value),
                        })
                      }
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Base Price
                    </label>
                    <input
                      type="number"
                      required
                      min="50"
                      value={showForm.price}
                      onChange={(e) =>
                        setShowForm({
                          ...showForm,
                          price: parseInt(e.target.value),
                        })
                      }
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Capacity Seats
                    </label>
                    <input
                      type="number"
                      required
                      value={showForm.availableSeats}
                      onChange={(e) =>
                        setShowForm({
                          ...showForm,
                          availableSeats: parseInt(e.target.value),
                        })
                      }
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Show Date
                    </label>
                    <input
                      type="date"
                      required
                      value={showForm.showDate}
                      onChange={(e) =>
                        setShowForm({ ...showForm, showDate: e.target.value })
                      }
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Show Time (HH:MM)
                    </label>
                    <input
                      type="time"
                      required
                      value={showForm.showTime}
                      onChange={(e) =>
                        setShowForm({ ...showForm, showTime: e.target.value })
                      }
                      className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 mt-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase disabled:opacity-50"
                >
                  {actionLoading ? "Saving details..." : "Save Show"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
