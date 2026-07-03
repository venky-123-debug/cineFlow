import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, NavLink } from "react-router-dom";
import { logoutUser } from "../../redux/slices/authSlice";
import { fetchCities, setSelectedCity } from "../../redux/slices/theatreSlice";
import { fetchMovies } from "../../redux/slices/movieSlice";

export default function Navbar() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const user      = useSelector((s) => s.auth.user);
  const cities    = useSelector((s) => s.theatres.cities);
  const selCity   = useSelector((s) => s.theatres.selectedCity);
  const [cityOpen, setCityOpen] = useState(false);
  const [search, setSearch]     = useState("");
  const [userOpen, setUserOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => { dispatch(fetchCities()); }, []);

  useEffect(() => {
    const close = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setCityOpen(false); setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleCitySelect = (city) => {
    dispatch(setSelectedCity(city));
    dispatch(fetchMovies({ city }));
    setCityOpen(false);
    navigate("/home");
  };

  const handleSearch = (e) => {
    if (e.key === "Enter" && search.trim()) {
      dispatch(fetchMovies({ search: search.trim(), city: selCity }));
      navigate("/home");
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  return (
    <nav className="bms-nav">
      <div className="bms-nav-inner" ref={dropRef}>
        {/* Logo */}
        <a href="/home" className="bms-logo">Cine<span>Flow</span></a>

        {/* City Selector */}
        <div style={{ position: "relative" }}>
          <button className="bms-city-btn" onClick={() => setCityOpen(o => !o)}>
            <span>📍</span>
            <span>{selCity || "Select City"}</span>
            <span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
          </button>
          {cityOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 200,
              background: "var(--card)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "8px 0", minWidth: 180,
              boxShadow: "0 16px 40px rgba(0,0,0,0.5)", maxHeight: 260, overflowY: "auto"
            }}>
              {cities.length === 0 && (
                <div style={{ padding: "10px 16px", color: "var(--dim)", fontSize: 13 }}>No cities found</div>
              )}
              {cities.map(c => (
                <button key={c} onClick={() => handleCitySelect(c)} style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "9px 16px", background: "transparent", border: "none",
                  color: selCity === c ? "var(--red)" : "var(--text)",
                  fontSize: 14, cursor: "pointer", fontFamily: "var(--font)",
                  fontWeight: selCity === c ? 600 : 400,
                  borderLeft: selCity === c ? "2px solid var(--red)" : "2px solid transparent",
                }}>{c}</button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <input
          className="bms-search"
          placeholder="🔍  Search movies, events…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearch}
        />

        {/* Nav Links */}
        <div className="bms-nav-links">
          <NavLink to="/home" className={({ isActive }) => `bms-nav-link${isActive ? " active" : ""}`}>Movies</NavLink>
          <NavLink to="/my-bookings" className={({ isActive }) => `bms-nav-link${isActive ? " active" : ""}`}>My Bookings</NavLink>

          {/* User menu */}
          <div style={{ position: "relative" }}>
            <button className="bms-nav-user" onClick={() => setUserOpen(o => !o)}>
              <div className="bms-nav-avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
              <span>{user?.name?.split(" ")[0]}</span>
              <span style={{ fontSize: 10, opacity: 0.5 }}>▼</span>
            </button>
            {userOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 200,
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 10, padding: "8px 0", minWidth: 160,
                boxShadow: "0 16px 40px rgba(0,0,0,0.5)"
              }}>
                <div style={{ padding: "8px 16px 12px", borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
                  <div style={{ fontSize: 11, color: "var(--dim)" }}>{user?.email}</div>
                </div>
                <a href="/my-bookings" style={{ display: "block", padding: "9px 16px", fontSize: 14, color: "var(--text)", cursor: "pointer" }}>🎟️ My Bookings</a>
                <button onClick={handleLogout} style={{
                  display: "block", width: "100%", textAlign: "left", padding: "9px 16px",
                  background: "none", border: "none", fontSize: 14, color: "var(--red)",
                  cursor: "pointer", fontFamily: "var(--font)"
                }}>🚪 Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
