import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import Header from "../components/Header";
import SecureImage from "../components/SecureImage";
import CinemaBackground from "../components/CinemaBackground";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");

  useEffect(() => {
    if (!bannerFile) {
      setBannerPreview("");
      return;
    }
    const url = URL.createObjectURL(bannerFile);
    setBannerPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [bannerFile]);


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
    cast: [],
    crew: [],
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

  // Bulk scheduling state
  const [bulkForm, setBulkForm] = useState({
    movieId: "",
    theatreId: "",
    screenNumber: 1,
    price: 200,
    availableSeats: 150,
    // date range
    dateFrom: new Date().toISOString().split("T")[0],
    dateTo: "",
    // or individual dates
    selectedDates: [],
    // time slots
    times: ["10:00", "14:00", "18:00"],
    // mode: "range" | "individual"
    dateMode: "range",
  });
  const [bulkResult, setBulkResult] = useState(null); // { created, skipped, errors }
  const [newCast, setNewCast] = useState({ name: "", character: "", profilePic: "" });
  const [newCrew, setNewCrew] = useState({ name: "", role: "", profilePic: "" });
  const [uploadingCastPic, setUploadingCastPic] = useState(false);
  const [uploadingCrewPic, setUploadingCrewPic] = useState(false);

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
        const statsRes = await axios.get("/api/bookings/stats", {
          headers: { "access-token": token },
        });
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
      } else if (activeTab === "movies") {
        const moviesRes = await axios.get("/api/movies", {
          headers: { "access-token": token },
          params: { limit: 100 },
        });
        if (moviesRes.data.success) {
          setMovies(moviesRes.data.data.movies || []);
        }
      } else if (activeTab === "theatres") {
        const theatresRes = await axios.get("/api/theatres", {
          headers: { "access-token": token },
          params: { limit: 100 },
        });
        if (theatresRes.data.success) {
          setTheatres(theatresRes.data.data.data || []);
        }
      } else if (activeTab === "shows") {
        const [showsRes, moviesRes, theatresRes] = await Promise.all([
          axios.get("/api/shows", {
            headers: { "access-token": token },
          }),
          axios.get("/api/movies", {
            headers: { "access-token": token },
            params: { limit: 100 },
          }),
          axios.get("/api/theatres", {
            headers: { "access-token": token },
            params: { limit: 100 },
          }),
        ]);

        if (showsRes.data.success) setShows(showsRes.data.data || []);
        if (moviesRes.data.success) setMovies(moviesRes.data.data.movies || []);
        if (theatresRes.data.success)
          setTheatres(theatresRes.data.data.data || []);
      } else if (activeTab === "bookings") {
        const bookingsRes = await axios.get("/api/bookings", {
          headers: { "access-token": token },
          params: { limit: 100 },
        });
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
      if (type === "movie") url = `/api/movies/${id}`;
      if (type === "theatre") url = `/api/theatres/${id}`;
      if (type === "show") url = `/api/shows/${id}`;

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
      const formData = new FormData();
      formData.append("title", movieForm.title);
      formData.append("description", movieForm.description);
      formData.append("duration", movieForm.duration);
      formData.append("language", movieForm.language);
      formData.append("rating", movieForm.rating);
      formData.append("censorRating", movieForm.censorRating);
      formData.append("trailerUrl", movieForm.trailerUrl);
      formData.append("releaseDate", movieForm.releaseDate);
      formData.append("cast", JSON.stringify(movieForm.cast || []));
      formData.append("crew", JSON.stringify(movieForm.crew || []));

      const genres = movieForm.genre
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

      genres.forEach((g) => {
        formData.append("genre", g);
      });

      if (bannerFile) {
        formData.append("banner", bannerFile);
      } else if (movieForm.banner) {
        formData.append("banner", movieForm.banner);
      }

      let res;
      if (showModal === "addMovie") {
        res = await axios.post("/api/movies", formData, {
          headers: {
            "access-token": token,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        res = await axios.patch(`/api/movies/${currentEditId}`, formData, {
          headers: {
            "access-token": token,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      if (res.data.success) {
        setSuccessMsg(
          showModal === "addMovie"
            ? "Movie created successfully."
            : "Movie updated successfully.",
        );
        setShowModal(false);
        setBannerFile(null);
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
        res = await axios.post("/api/theatres", payload, {
          headers: { "access-token": token },
        });
      } else {
        res = await axios.patch(`/api/theatres/${currentEditId}`, payload, {
          headers: { "access-token": token },
        });
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
        res = await axios.post("/api/shows", payload, {
          headers: { "access-token": token },
        });
      } else {
        res = await axios.patch(`/api/shows/${currentEditId}`, payload, {
          headers: { "access-token": token },
        });
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

  // Bulk show scheduling — generate date list from range or individual selection
  const getBulkDates = () => {
    if (bulkForm.dateMode === "individual") return bulkForm.selectedDates;
    if (!bulkForm.dateFrom || !bulkForm.dateTo) return bulkForm.dateFrom ? [bulkForm.dateFrom] : [];
    const result = [];
    const cur = new Date(bulkForm.dateFrom);
    const end = new Date(bulkForm.dateTo);
    while (cur <= end) {
      result.push(cur.toISOString().split("T")[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  };

  const handleBulkShowSubmit = async (e) => {
    e.preventDefault();
    setBulkResult(null);
    setActionLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const dates = getBulkDates();
      const times = bulkForm.times.filter((t) => t.trim() !== "");
      if (dates.length === 0) throw new Error("Select at least one date");
      if (times.length === 0) throw new Error("Add at least one time slot");

      const res = await axios.post(
        "/api/shows/bulk",
        {
          movieId: bulkForm.movieId,
          theatreId: bulkForm.theatreId,
          screenNumber: bulkForm.screenNumber,
          price: bulkForm.price,
          availableSeats: bulkForm.availableSeats,
          dates,
          times,
        },
        { headers: { "access-token": token } }
      );

      if (res.data.success) {
        setBulkResult(res.data.data);
        setSuccessMsg(res.data.message);
        loadData();
      } else {
        setError(res.data.message || "Bulk scheduling failed.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Operation failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const initMovieEdit = (movie) => {
    setBannerFile(null);
    setMovieForm({
      title: movie.title || "",
      description: movie.description || "",
      duration: movie.duration || 120,
      genre: movie.genre?.join(", ") || "",
      banner: movie.banner || "",
      trailerUrl: movie.trailerUrl || "",
      rating: movie.rating || 8,
      releaseDate: movie.releaseDate ? movie.releaseDate.split("T")[0] : "",
      language: movie.language || "English",
      censorRating: movie.censorRating || "UA",
      cast: movie.cast || [],
      crew: movie.crew || [],
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

  const addCastMember = () => {
    if (!newCast.name || !newCast.character) return;
    setMovieForm((prev) => ({
      ...prev,
      cast: [...(prev.cast || []), newCast],
    }));
    setNewCast({ name: "", character: "", profilePic: "" });
  };

  const removeCastMember = (index) => {
    setMovieForm((prev) => ({
      ...prev,
      cast: (prev.cast || []).filter((_, i) => i !== index),
    }));
  };

  const addCrewMember = () => {
    if (!newCrew.name || !newCrew.role) return;
    setMovieForm((prev) => ({
      ...prev,
      crew: [...(prev.crew || []), newCrew],
    }));
    setNewCrew({ name: "", role: "", profilePic: "" });
  };

  const removeCrewMember = (index) => {
    setMovieForm((prev) => ({
      ...prev,
      crew: (prev.crew || []).filter((_, i) => i !== index),
    }));
  };

  const handleCastPicUpload = async (file) => {
    if (!file) return;
    setUploadingCastPic(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post("/api/files/upload", formData, {
        headers: {
          "access-token": token,
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.data.success) {
        setNewCast((prev) => ({ ...prev, profilePic: res.data.data.imageUrl }));
      } else {
        alert(res.data.message || "Failed to upload cast picture.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload cast picture.");
    } finally {
      setUploadingCastPic(false);
    }
  };

  const handleCrewPicUpload = async (file) => {
    if (!file) return;
    setUploadingCrewPic(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post("/api/files/upload", formData, {
        headers: {
          "access-token": token,
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.data.success) {
        setNewCrew((prev) => ({ ...prev, profilePic: res.data.data.imageUrl }));
      } else {
        alert(res.data.message || "Failed to upload crew picture.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload crew picture.");
    } finally {
      setUploadingCrewPic(false);
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-hidden">
      <CinemaBackground />

      <div className="relative z-10 flex flex-col flex-1">
      <Header />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto px-6 py-8 gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-[220px] shrink-0 flex flex-col gap-2">
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-600/5 mb-4 text-center">
            <span className="text-xs text-gray-500 font-bold uppercase block">
              Workspace Role
            </span>
            <span className="text-sm font-black text-rose-500 mt-0.5 block uppercase tracking-wide">
              ADMIN CONTROL
            </span>
          </div>

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full text-left px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
              activeTab === "dashboard"
                ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/20"
                : "bg-zinc-900/60 border-zinc-850 text-gray-400 hover:text-white"
            }`}
          >
            Dashboard Stats
          </button>

          <button
            onClick={() => setActiveTab("movies")}
            className={`w-full text-left px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
              activeTab === "movies"
                ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/20"
                : "bg-zinc-900/60 border-zinc-850 text-gray-400 hover:text-white"
            }`}
          >
            Manage Movies
          </button>

          <button
            onClick={() => setActiveTab("theatres")}
            className={`w-full text-left px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
              activeTab === "theatres"
                ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/20"
                : "bg-zinc-900/60 border-zinc-850 text-gray-400 hover:text-white"
            }`}
          >
            Manage Theatres
          </button>

          <button
            onClick={() => setActiveTab("shows")}
            className={`w-full text-left px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
              activeTab === "shows"
                ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/20"
                : "bg-zinc-900/60 border-zinc-850 text-gray-400 hover:text-white"
            }`}
          >
            Manage Shows
          </button>

          <button
            onClick={() => setActiveTab("bookings")}
            className={`w-full text-left px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
              activeTab === "bookings"
                ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/20"
                : "bg-zinc-900/60 border-zinc-850 text-gray-400 hover:text-white"
            }`}
          >
            Ticket Ledger
          </button>
        </aside>

        {/* Workspace content section */}
        <main className="flex-1 min-w-0 bg-zinc-900/20 border border-zinc-850 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          {/* Header row */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900 pb-4 mb-6 gap-4">
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
                    setBannerFile(null);
                    setMovieForm({
                      title: "",
                      description: "",
                      duration: 120,
                      genre: "",
                      banner: "",
                      trailerUrl: "",
                      rating: 8,
                      releaseDate: "",
                      language: "English",
                      censorRating: "UA",
                      cast: [],
                      crew: [],
                    });
                    setShowModal("addMovie");
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg"
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
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg"
                >
                  + Add Theatre
                </button>
              )}
              {activeTab === "shows" && (
                <div className="flex gap-2 flex-wrap">
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
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-xl text-xs font-black shadow"
                  >
                    + Add Show
                  </button>
                  <button
                    onClick={() => {
                      setBulkForm({
                        movieId: movies[0]?.id || "",
                        theatreId: theatres[0]?.id || "",
                        screenNumber: 1,
                        price: 200,
                        availableSeats: theatres[0]?.totalSeats || 150,
                        dateFrom: new Date().toISOString().split("T")[0],
                        dateTo: "",
                        selectedDates: [],
                        times: ["10:00", "14:00", "18:00"],
                        dateMode: "range",
                      });
                      setBulkResult(null);
                      setShowModal("bulkShow");
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg"
                  >
                    ⚡ Bulk Schedule
                  </button>
                </div>
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
                  className="animate-spin h-10 w-10 text-rose-500"
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
                      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between shadow-md">
                        <div>
                          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block">
                            Total Bookings
                          </span>
                          <span className="text-3xl font-black text-rose-500 block mt-1.5">
                            {stats.totalBookings}
                          </span>
                        </div>
                        <div className="p-3.5 rounded-full bg-rose-600/10 text-rose-500 border border-rose-600/10">
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

                      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between shadow-md">
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
                      <h3 className="text-base font-bold tracking-wide border-l-4 border-rose-600 pl-3">
                        Recent Confirmations
                      </h3>

                      {stats.recentBookings?.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">
                          No bookings recorded yet.
                        </p>
                      ) : (
                        <div className="overflow-x-auto border border-zinc-900 rounded-xl">
                          <table className="w-full text-xs text-left text-gray-400">
                            <thead className="bg-zinc-950 text-white font-bold uppercase text-[10px] tracking-wider border-b border-zinc-900">
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
                                  className="border-b border-zinc-900 hover:bg-zinc-900/40"
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
                                  <td className="p-4 font-bold text-rose-500 uppercase">
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
                      <div className="overflow-x-auto border border-zinc-900 rounded-xl">
                        <table className="w-full text-xs text-left text-gray-400">
                          <thead className="bg-zinc-950 text-white font-bold uppercase text-[10px] tracking-wider border-b border-zinc-900">
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
                                className="border-b border-zinc-900 hover:bg-zinc-900/40"
                              >
                                <td className="p-4 font-semibold text-gray-200 flex items-center gap-3">
                                  {movie.banner && (
                                    <SecureImage
                                      src={movie.banner}
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
                                        className="text-[10px] px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-gray-400"
                                      >
                                        {g}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                  <button
                                    onClick={() => initMovieEdit(movie)}
                                    className="px-2.5 py-1 text-[10px] bg-slate-850 hover:bg-slate-800 border border-zinc-800 text-rose-500 rounded-md font-bold"
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
                      <div className="overflow-x-auto border border-zinc-900 rounded-xl">
                        <table className="w-full text-xs text-left text-gray-400">
                          <thead className="bg-zinc-950 text-white font-bold uppercase text-[10px] tracking-wider border-b border-zinc-900">
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
                                className="border-b border-zinc-900 hover:bg-zinc-900/40"
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
                                <td className="p-4 font-bold text-rose-500">
                                  {theatre.totalSeats} seats
                                </td>
                                <td className="p-4 font-semibold text-gray-300">
                                  {theatre.screens || 1} screens
                                </td>
                                <td className="p-4 text-right space-x-2">
                                  <button
                                    onClick={() => initTheatreEdit(theatre)}
                                    className="px-2.5 py-1 text-[10px] bg-slate-850 hover:bg-slate-800 border border-zinc-800 text-rose-500 rounded-md font-bold"
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
                      <div className="overflow-x-auto border border-zinc-900 rounded-xl">
                        <table className="w-full text-xs text-left text-gray-400">
                          <thead className="bg-zinc-950 text-white font-bold uppercase text-[10px] tracking-wider border-b border-zinc-900">
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
                                  className="border-b border-zinc-900 hover:bg-zinc-900/40"
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
                                    <span className="text-rose-500 font-black text-[10px] block mt-0.5 uppercase">
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
                                      className="px-2.5 py-1 text-[10px] bg-slate-855 hover:bg-slate-800 border border-zinc-800 text-rose-500 rounded-md font-bold"
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
                      <div className="overflow-x-auto border border-zinc-900 rounded-xl">
                        <table className="w-full text-xs text-left text-gray-400">
                          <thead className="bg-zinc-950 text-white font-bold uppercase text-[10px] tracking-wider border-b border-zinc-900">
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
                                className="border-b border-zinc-900 hover:bg-zinc-900/40"
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
                                <td className="p-4 font-bold text-rose-500 uppercase">
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
                                          : "bg-rose-600/10 text-rose-500 border-rose-600/20"
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

          <div className="border-t border-zinc-900 pt-4 mt-6 text-center text-[10px] text-gray-500 font-bold uppercase">
            CineFlow Admin Panel • Verified Security
          </div>
        </main>
      </div>

      {/* CRUD MODALS */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3 mb-4">
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
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
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
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
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
                    className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
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
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
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
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
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
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
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
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
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
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Upload Banner File
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setBannerFile(e.target.files[0])}
                      className="w-full text-xs text-gray-405 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-black file:bg-rose-600/10 file:text-rose-500 hover:file:bg-rose-600/20 cursor-pointer border border-zinc-800 p-1 bg-zinc-950 rounded-lg"
                    />
                  </div>
                  {(bannerPreview || movieForm.banner) && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Banner Preview
                      </label>
                      <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 p-2 flex items-center justify-center aspect-video w-full">
                        {bannerPreview ? (
                          <img
                            src={bannerPreview}
                            alt="Banner Preview"
                            className="max-h-full max-w-full object-contain rounded"
                          />
                        ) : (
                          <SecureImage
                            src={movieForm.banner}
                            alt="Current Banner"
                            className="max-h-full max-w-full object-contain rounded"
                          />
                        )}
                      </div>
                    </div>
                  )}
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
                    className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
                  />
                </div>

                {/* Cast Section */}
                <div className="border-t border-zinc-800/80 pt-4 mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2">
                    Cast Members
                  </h4>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Actor Name"
                      value={newCast.name}
                      onChange={(e) => setNewCast({ ...newCast, name: e.target.value })}
                      className="p-2 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-white focus:outline-none focus:border-rose-600 w-full"
                    />
                    <input
                      type="text"
                      placeholder="Character Name"
                      value={newCast.character}
                      onChange={(e) => setNewCast({ ...newCast, character: e.target.value })}
                      className="p-2 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-white focus:outline-none focus:border-rose-600 w-full"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center mb-2">
                    <div className="col-span-2">
                      <label className="block text-[8px] font-bold text-gray-500 uppercase mb-0.5">
                        Upload Profile Pic
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCastPicUpload(e.target.files[0])}
                        className="w-full text-[10px] text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-rose-600/10 file:text-rose-500 hover:file:bg-rose-600/20 cursor-pointer border border-zinc-800 p-1 bg-zinc-950 rounded"
                      />
                    </div>
                    <div className="h-12 w-12 rounded-full border border-zinc-800 bg-zinc-950 overflow-hidden flex items-center justify-center self-end">
                      {uploadingCastPic ? (
                        <span className="text-[8px] text-rose-500 animate-pulse font-bold">Uploading...</span>
                      ) : newCast.profilePic ? (
                        <SecureImage src={newCast.profilePic} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-zinc-650 font-bold uppercase">No Pic</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addCastMember}
                    className="px-3 py-1.5 bg-rose-600/10 text-rose-500 hover:bg-rose-600/20 border border-rose-500/20 text-[10px] font-black uppercase rounded-lg w-full mb-3"
                  >
                    + Add Actor
                  </button>

                  {/* Cast List */}
                  {movieForm.cast && movieForm.cast.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1 bg-zinc-950 p-2 rounded-lg border border-zinc-800 mb-4">
                      {movieForm.cast.map((actor, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] text-gray-400 py-1 border-b border-zinc-900/60 last:border-0">
                          <div className="flex items-center gap-2">
                            {actor.profilePic && (
                              <SecureImage src={actor.profilePic} alt="" className="w-6 h-6 rounded-full object-cover border border-zinc-800" />
                            )}
                            <span className="font-bold text-white">{actor.name}</span>
                          </div>
                          <span>as {actor.character}</span>
                          <button
                            type="button"
                            onClick={() => removeCastMember(idx)}
                            className="text-rose-500 hover:text-rose-400 font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Crew Section */}
                <div className="border-t border-zinc-800/80 pt-4 mt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2">
                    Crew Members
                  </h4>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Crew Name"
                      value={newCrew.name}
                      onChange={(e) => setNewCrew({ ...newCrew, name: e.target.value })}
                      className="p-2 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-white focus:outline-none focus:border-rose-600 w-full"
                    />
                    <input
                      type="text"
                      placeholder="Role (e.g. Director)"
                      value={newCrew.role}
                      onChange={(e) => setNewCrew({ ...newCrew, role: e.target.value })}
                      className="p-2 rounded bg-zinc-950 border border-zinc-800 text-[11px] text-white focus:outline-none focus:border-rose-600 w-full"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 items-center mb-2">
                    <div className="col-span-2">
                      <label className="block text-[8px] font-bold text-gray-500 uppercase mb-0.5">
                        Upload Profile Pic
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCrewPicUpload(e.target.files[0])}
                        className="w-full text-[10px] text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-rose-600/10 file:text-rose-500 hover:file:bg-rose-600/20 cursor-pointer border border-zinc-800 p-1 bg-zinc-950 rounded"
                      />
                    </div>
                    <div className="h-12 w-12 rounded-full border border-zinc-800 bg-zinc-950 overflow-hidden flex items-center justify-center self-end">
                      {uploadingCrewPic ? (
                        <span className="text-[8px] text-rose-500 animate-pulse font-bold">Uploading...</span>
                      ) : newCrew.profilePic ? (
                        <SecureImage src={newCrew.profilePic} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-zinc-650 font-bold uppercase">No Pic</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addCrewMember}
                    className="px-3 py-1.5 bg-rose-600/10 text-rose-500 hover:bg-rose-600/20 border border-rose-500/20 text-[10px] font-black uppercase rounded-lg w-full mb-3"
                  >
                    + Add Crew Member
                  </button>

                  {/* Crew List */}
                  {movieForm.crew && movieForm.crew.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1 bg-zinc-950 p-2 rounded-lg border border-zinc-800 mb-2">
                      {movieForm.crew.map((member, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] text-gray-400 py-1 border-b border-zinc-900/60 last:border-0">
                          <div className="flex items-center gap-2">
                            {member.profilePic && (
                              <SecureImage src={member.profilePic} alt="" className="w-6 h-6 rounded-full object-cover border border-zinc-800" />
                            )}
                            <span className="font-bold text-white">{member.name}</span>
                          </div>
                          <span>— {member.role}</span>
                          <button
                            type="button"
                            onClick={() => removeCrewMember(idx)}
                            className="text-rose-500 hover:text-rose-400 font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 mt-4 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase disabled:opacity-50"
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
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
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
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
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
                    className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
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
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
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
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
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
                    className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 mt-4 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase disabled:opacity-50"
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
                    className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
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
                    className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
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
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
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
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
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
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
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
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
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
                      className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 mt-4 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase disabled:opacity-50"
                >
                  {actionLoading ? "Saving details..." : "Save Show"}
                </button>
              </form>
            )}

            {/* ─── BULK SCHEDULING FORM ─── */}
            {showModal === "bulkShow" && (() => {
              const previewDates = getBulkDates();
              const totalShows = previewDates.length * bulkForm.times.filter(t => t.trim()).length;
              return (
                <form onSubmit={handleBulkShowSubmit} className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
                    <span className="text-lg">⚡</span>
                    <div>
                      <h3 className="text-sm font-black text-white">Bulk Schedule Shows</h3>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                        Create {totalShows} show{totalShows !== 1 ? "s" : ""} across {previewDates.length} date{previewDates.length !== 1 ? "s" : ""} × {bulkForm.times.filter(t=>t.trim()).length} time{bulkForm.times.filter(t=>t.trim()).length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Movie & Theatre */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Movie</label>
                      <select
                        required
                        value={bulkForm.movieId}
                        onChange={(e) => setBulkForm({ ...bulkForm, movieId: e.target.value })}
                        className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
                      >
                        <option value="" disabled>Select Movie</option>
                        {movies.map((m) => (
                          <option key={m.id} value={m.id}>{m.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Theatre</label>
                      <select
                        required
                        value={bulkForm.theatreId}
                        onChange={(e) => {
                          const th = theatres.find(t => t.id === e.target.value);
                          setBulkForm({ ...bulkForm, theatreId: e.target.value, availableSeats: th?.totalSeats || bulkForm.availableSeats });
                        }}
                        className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600"
                      >
                        <option value="" disabled>Select Theatre</option>
                        {theatres.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Screen / Price / Seats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Screen No.</label>
                      <input type="number" min="1" required value={bulkForm.screenNumber}
                        onChange={(e) => setBulkForm({ ...bulkForm, screenNumber: parseInt(e.target.value) })}
                        className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Base Price (₹)</label>
                      <input type="number" min="50" required value={bulkForm.price}
                        onChange={(e) => setBulkForm({ ...bulkForm, price: parseInt(e.target.value) })}
                        className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Capacity</label>
                      <input type="number" min="1" required value={bulkForm.availableSeats}
                        onChange={(e) => setBulkForm({ ...bulkForm, availableSeats: parseInt(e.target.value) })}
                        className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600" />
                    </div>
                  </div>

                  {/* DATE SELECTION */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">📅 Date Selection</span>
                      <div className="flex gap-1">
                        {["range", "individual"].map((mode) => (
                          <button key={mode} type="button"
                            onClick={() => setBulkForm({ ...bulkForm, dateMode: mode, selectedDates: [] })}
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${
                              bulkForm.dateMode === mode
                                ? "bg-rose-600 text-white"
                                : "bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white"
                            }`}>
                            {mode === "range" ? "Date Range" : "Pick Dates"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {bulkForm.dateMode === "range" ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">From Date</label>
                          <input type="date" required value={bulkForm.dateFrom}
                            onChange={(e) => setBulkForm({ ...bulkForm, dateFrom: e.target.value })}
                            className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">To Date</label>
                          <input type="date" value={bulkForm.dateTo}
                            min={bulkForm.dateFrom}
                            onChange={(e) => setBulkForm({ ...bulkForm, dateTo: e.target.value })}
                            className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2 items-center">
                          <input type="date"
                            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600 flex-1"
                            onChange={(e) => {
                              const d = e.target.value;
                              if (d && !bulkForm.selectedDates.includes(d)) {
                                setBulkForm({ ...bulkForm, selectedDates: [...bulkForm.selectedDates, d].sort() });
                              }
                              e.target.value = "";
                            }}
                          />
                          <span className="text-[10px] text-zinc-500 font-bold">← pick to add</span>
                        </div>
                        {bulkForm.selectedDates.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {bulkForm.selectedDates.map((d) => (
                              <span key={d} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600/15 border border-rose-600/30 text-rose-400 text-[10px] font-bold">
                                {d}
                                <button type="button" onClick={() =>
                                  setBulkForm({ ...bulkForm, selectedDates: bulkForm.selectedDates.filter(x => x !== d) })
                                } className="hover:text-white transition-colors">×</button>
                              </span>
                            ))}
                          </div>
                        )}
                        {bulkForm.selectedDates.length === 0 && (
                          <p className="text-[10px] text-zinc-600 italic">No dates selected yet.</p>
                        )}
                      </div>
                    )}

                    {/* Date preview pills */}
                    {previewDates.length > 0 && (
                      <div className="pt-2 border-t border-zinc-800">
                        <span className="text-[10px] font-black text-zinc-500 uppercase">Preview — {previewDates.length} date{previewDates.length !== 1 ? "s" : ""}:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-[80px] overflow-y-auto">
                          {previewDates.map((d) => (
                            <span key={d} className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-bold">
                              {new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" })}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* TIME SLOTS */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">🕐 Time Slots</span>
                      <button type="button"
                        onClick={() => setBulkForm({ ...bulkForm, times: [...bulkForm.times, ""] })}
                        className="px-3 py-1 rounded-full text-[10px] font-black bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all">
                        + Add Slot
                      </button>
                    </div>
                    <div className="space-y-2">
                      {bulkForm.times.map((t, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-zinc-600 w-5">#{i + 1}</span>
                          <input type="time" value={t} required
                            onChange={(e) => {
                              const newTimes = [...bulkForm.times];
                              newTimes[i] = e.target.value;
                              setBulkForm({ ...bulkForm, times: newTimes });
                            }}
                            className="flex-1 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-rose-600" />
                          {bulkForm.times.length > 1 && (
                            <button type="button"
                              onClick={() => setBulkForm({ ...bulkForm, times: bulkForm.times.filter((_, j) => j !== i) })}
                              className="text-zinc-600 hover:text-rose-400 text-lg leading-none transition-colors">×</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Schedule Matrix Preview */}
                  {previewDates.length > 0 && bulkForm.times.filter(t => t.trim()).length > 0 && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block mb-2">
                        📋 Schedule Matrix — {totalShows} show{totalShows !== 1 ? "s" : ""} will be created
                      </span>
                      <div className="overflow-x-auto">
                        <table className="text-[10px] border-collapse">
                          <thead>
                            <tr>
                              <th className="p-1.5 text-zinc-500 font-black text-left pr-4">Date \ Time</th>
                              {bulkForm.times.filter(t => t.trim()).map((t, i) => (
                                <th key={i} className="p-1.5 text-amber-400 font-black">{t}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewDates.slice(0, 14).map((d) => (
                              <tr key={d}>
                                <td className="p-1.5 text-zinc-400 font-bold pr-4 whitespace-nowrap">
                                  {new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" })}
                                </td>
                                {bulkForm.times.filter(t => t.trim()).map((t, i) => (
                                  <td key={i} className="p-1.5 text-center">
                                    <span className="inline-block w-4 h-4 rounded-full bg-rose-600/30 border border-rose-600/50" title={`${d} ${t}`} />
                                  </td>
                                ))}
                              </tr>
                            ))}
                            {previewDates.length > 14 && (
                              <tr><td colSpan={bulkForm.times.length + 1} className="p-1.5 text-zinc-600 italic">…and {previewDates.length - 14} more dates</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Bulk result summary */}
                  {bulkResult && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                      <span className="text-[10px] font-black text-emerald-400 uppercase block">✅ Bulk Result</span>
                      <div className="flex gap-4 text-xs font-bold">
                        <span className="text-emerald-400">✓ {bulkResult.created?.length || 0} created</span>
                        <span className="text-amber-400">⊘ {bulkResult.skipped?.length || 0} skipped (duplicates)</span>
                        <span className="text-rose-400">✗ {bulkResult.errors?.length || 0} errors</span>
                      </div>
                      {bulkResult.skipped?.length > 0 && (
                        <div className="text-[10px] text-zinc-500">{bulkResult.skipped.join(" · ")}</div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={actionLoading || previewDates.length === 0 || bulkForm.times.filter(t => t.trim()).length === 0}
                    className="w-full py-3 mt-2 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-rose-600/20"
                  >
                    {actionLoading
                      ? `Creating shows...`
                      : `⚡ Create ${totalShows} Show${totalShows !== 1 ? "s" : ""}`
                    }
                  </button>
                </form>
              );
            })()}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

