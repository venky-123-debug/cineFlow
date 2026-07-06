import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Header({
  selectedCity,
  onCityChange,
  searchQuery,
  onSearchChange,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/theatres/cities", {
          headers: { "access-token": token },
        });
        if (res.data.success && res.data.data?.length > 0) {
          setCities(res.data.data);
          if (!selectedCity && onCityChange) {
            onCityChange(res.data.data[0]);
          }
        } else {
          setCities([
            "Bangalore",
            "Mumbai",
            "Delhi",
            "Hyderabad",
            "Chennai",
            "Pune",
          ]);
          if (!selectedCity && onCityChange) {
            onCityChange("Bangalore");
          }
        }
      } catch (err) {
        console.error("Failed to fetch cities", err);
        setCities([
          "Bangalore",
          "Mumbai",
          "Delhi",
          "Hyderabad",
          "Chennai",
          "Pune",
        ]);
        if (!selectedCity && onCityChange) {
          onCityChange("Bangalore");
        }
      }
    };
    fetchCities();
  }, []);

  const handleLogout = () => {
    dispatch({ type: "auth/logout" });
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-zinc-950/85 border-b border-zinc-900 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all duration-300">
      {/* Brand & City Pin */}
      <div className="flex items-center justify-between md:justify-start gap-8">
        <Link
          to="/"
          className="text-2xl font-black bg-linear-to-r from-rose-500 via-red-500 to-pink-600 bg-clip-text text-transparent tracking-widest hover:opacity-95 transition-all flex items-center gap-2 drop-shadow-[0_2px_10px_rgba(244,63,94,0.15)]"
        >
          <svg
            className="w-6 h-6 text-rose-500"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h6v4H7V5zm8 8v2h-1v-2h1zm-2-2H9v4h4v-4zm2 0h1v2h-1v-2zm-3-6h2v2h-2V5zM7 11H3v4h4v-4zm-4-2h2v2H3V9zm2-4H3v2h2V5zm10 6h1v2h-1v-2zm1-2h-1V7h1v2z"
              clipRule="evenodd"
            ></path>
          </svg>
          CINEFLOW
        </Link>

        {/* City Selector */}
        <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-full px-4 py-1.5 text-xs text-zinc-300 focus-within:border-rose-500/50 transition-all duration-300 shadow-sm">
          <svg
            className="w-3.5 h-3.5 text-rose-500 animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            ></path>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
          </svg>
          <select
            value={selectedCity || ""}
            onChange={(e) => onCityChange && onCityChange(e.target.value)}
            className="bg-transparent border-none text-zinc-100 font-bold focus:outline-none cursor-pointer pr-5 py-0.5"
          >
            {cities.map((city) => (
              <option
                key={city}
                value={city}
                className="bg-zinc-950 text-zinc-100"
              >
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Bar */}
      {onSearchChange !== undefined && (
        <div className="flex-1 max-w-md mx-0 md:mx-6 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="w-4 h-4 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery || ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search for movies, genres, languages..."
            className="w-full bg-zinc-900/50 border border-zinc-800/80 text-zinc-100 pl-11 pr-4 py-2 rounded-full focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder-zinc-500 transition-all duration-300 text-xs font-medium"
          />
        </div>
      )}

      {/* Nav Links & Actions */}
      <div className="flex items-center justify-between md:justify-end gap-6 text-xs font-semibold">
        <Link
          to="/events"
          className="text-zinc-300 hover:text-rose-500 transition-all duration-300 flex items-center gap-2 group"
        >
          <svg
            className="w-4 h-4 text-zinc-400 group-hover:text-rose-500 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Events
        </Link>
        <Link
          to="/my-bookings"
          className="text-zinc-300 hover:text-rose-500 transition-all duration-300 flex items-center gap-2 group"
        >
          <svg
            className="w-4 h-4 text-zinc-400 group-hover:text-rose-500 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
            ></path>
          </svg>
          My Bookings
        </Link>

        <div className="h-5 w-px bg-zinc-800 hidden md:block"></div>

        {/* User profile & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-zinc-200 font-bold text-xs">
              {user?.name}
            </span>
            <span className="text-zinc-500 text-[9px] uppercase font-black tracking-wider">
              {user?.role}
            </span>
          </div>
          <div className="h-8 w-8 rounded-full bg-linear-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white font-black text-xs shadow-md border border-rose-400/20">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-rose-500 transition-all duration-300"
            title="Sign Out"
          >
            <svg
              className="w-4.5 h-4.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
