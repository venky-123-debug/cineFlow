import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchMovies } from "../../redux/slices/movieSlice";
import { fetchShows } from "../../redux/slices/showSlice";
import api from "../../services/api";

const IconFilm = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>
  </svg>
);
const IconTheater = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9V5a2 2 0 012-2h16a2 2 0 012 2v4"/><path d="M2 13v4a2 2 0 002 2h16a2 2 0 002-2v-4"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="2" y1="13" x2="22" y2="13"/>
  </svg>
);
const IconTicket = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 010-6h20a3 3 0 010 6"/><path d="M2 15a3 3 0 000 6h20a3 3 0 000-6"/><line x1="2" y1="12" x2="22" y2="12"/>
  </svg>
);
const IconRevenue = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
  </svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconChart = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IconArrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IconGlobe = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
  </svg>
);

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
    { title: "Total Movies", value: movies.length, icon: <IconFilm />, accent: "#3B82F6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.15)" },
    { title: "Active Shows", value: shows.length, icon: <IconTheater />, accent: "#8B5CF6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.15)" },
    { title: "Total Bookings", value: stats.totalBookings, icon: <IconTicket />, accent: "#10B981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.15)" },
    { title: "Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: <IconRevenue />, accent: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.15)" },
  ];

  const quickActions = [
    { label: "Add Movie", icon: <IconPlus />, desc: "Upload & publish a new title" },
    { label: "Create Show", icon: <IconTheater />, desc: "Schedule a new screening" },
    { label: "Analytics", icon: <IconChart />, desc: "Revenue & booking trends" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .ad-root {
          font-family: 'Inter', sans-serif;
          min-height: 100%;
          background: #0A0A0F;
          padding: 2rem 2rem 3rem;
          box-sizing: border-box;
          color: #F9FAFB;
        }

        /* Header */
        .ad-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 2.25rem;
        }
        .ad-eyebrow {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #E63946;
          margin-bottom: 0.3rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .ad-eyebrow-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #E63946;
          box-shadow: 0 0 6px rgba(230,57,70,0.8);
          animation: adpulse 2s ease-in-out infinite;
        }
        @keyframes adpulse {
          0%,100% { opacity:1; } 50% { opacity:0.4; }
        }
        .ad-title {
          font-size: 1.6rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #F9FAFB;
          line-height: 1;
        }
        .ad-date {
          font-size: 0.75rem;
          color: #2D2D3A;
          font-weight: 500;
        }

        /* Stat grid */
        .ad-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        @media (max-width: 900px) { .ad-stats { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 520px) { .ad-stats { grid-template-columns: 1fr; } }

        .ad-stat-card {
          background: #111118;
          border-radius: 12px;
          padding: 1.25rem 1.25rem 1.1rem;
          border: 1px solid #1A1A24;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .ad-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .ad-stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: var(--accent);
          opacity: 0.7;
        }
        .ad-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.9rem;
        }
        .ad-stat-label {
          font-size: 0.72rem;
          font-weight: 500;
          color: #4B5563;
          letter-spacing: 0.03em;
        }
        .ad-stat-icon {
          width: 32px; height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--icon-bg);
          border: 1px solid var(--icon-border);
          color: var(--accent);
        }
        .ad-stat-value {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.04em;
          color: #F9FAFB;
          line-height: 1;
        }

        /* Two-col layout */
        .ad-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        @media (max-width: 700px) { .ad-cols { grid-template-columns: 1fr; } }

        /* Panel */
        .ad-panel {
          background: #111118;
          border: 1px solid #1A1A24;
          border-radius: 12px;
          padding: 1.4rem;
        }
        .ad-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.1rem;
        }
        .ad-panel-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #D1D5DB;
          letter-spacing: -0.01em;
        }
        .ad-panel-action {
          font-size: 0.7rem;
          color: #3D3D50;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          transition: color 0.2s;
          background: none;
          border: none;
          font-family: 'Inter', sans-serif;
        }
        .ad-panel-action:hover { color: #E63946; }

        /* Quick action buttons */
        .ad-actions {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .ad-action-btn {
          width: 100%;
          background: #0D0D14;
          border: 1px solid #1A1A24;
          border-radius: 9px;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
          text-align: left;
        }
        .ad-action-btn:hover {
          border-color: #E63946;
          background: rgba(230,57,70,0.04);
        }
        .ad-action-btn:hover .ad-action-arrow { color: #E63946; }
        .ad-action-icon {
          width: 30px; height: 30px;
          border-radius: 7px;
          background: rgba(230,57,70,0.08);
          border: 1px solid rgba(230,57,70,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #E63946;
          flex-shrink: 0;
        }
        .ad-action-text { flex: 1; }
        .ad-action-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: #D1D5DB;
          display: block;
          margin-bottom: 0.1rem;
        }
        .ad-action-desc {
          font-size: 0.7rem;
          color: #3D3D50;
        }
        .ad-action-arrow { color: #2D2D3A; transition: color 0.2s; }

        /* Movie grid */
        .ad-movies-panel {
          background: #111118;
          border: 1px solid #1A1A24;
          border-radius: 12px;
          padding: 1.4rem;
          margin-bottom: 1.5rem;
        }
        .ad-movie-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
        }
        @media (max-width: 900px) { .ad-movie-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 520px) { .ad-movie-grid { grid-template-columns: 1fr; } }

        .ad-movie-card {
          background: #0D0D14;
          border: 1px solid #1A1A24;
          border-radius: 9px;
          overflow: hidden;
          transition: all 0.2s;
          cursor: pointer;
        }
        .ad-movie-card:hover {
          border-color: #2D2D3A;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        }
        .ad-movie-img {
          width: 100%;
          height: 110px;
          object-fit: cover;
          display: block;
        }
        .ad-movie-placeholder {
          width: 100%;
          height: 110px;
          background: #1A1A24;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2D2D3A;
        }
        .ad-movie-body { padding: 0.65rem 0.75rem; }
        .ad-movie-title {
          font-size: 0.78rem;
          font-weight: 600;
          color: #D1D5DB;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 0.2rem;
        }
        .ad-movie-lang {
          font-size: 0.66rem;
          color: #3D3D50;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        /* Empty state */
        .ad-empty {
          text-align: center;
          padding: 2.5rem 1rem;
          color: #2D2D3A;
          font-size: 0.8rem;
        }
      `}</style>

      <div className="ad-root">
        {/* Header */}
        <div className="ad-header">
          <div>
            <div className="ad-eyebrow">
              <span className="ad-eyebrow-dot" />
              Admin Console
            </div>
            <div className="ad-title">Dashboard</div>
          </div>
          <div className="ad-date">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </div>
        </div>

        {/* Stats */}
        <div className="ad-stats">
          {statCards.map((card, i) => (
            <div
              key={i}
              className="ad-stat-card"
              style={{ "--accent": card.accent, "--icon-bg": card.bg, "--icon-border": card.border }}
            >
              <div className="ad-stat-top">
                <span className="ad-stat-label">{card.title}</span>
                <div className="ad-stat-icon">{card.icon}</div>
              </div>
              <div className="ad-stat-value">{card.value}</div>
            </div>
          ))}
        </div>

        {/* Two col: Quick actions + mini chart placeholder */}
        <div className="ad-cols">
          <div className="ad-panel">
            <div className="ad-panel-header">
              <span className="ad-panel-title">Quick Actions</span>
            </div>
            <div className="ad-actions">
              {quickActions.map((a, i) => (
                <button key={i} className="ad-action-btn">
                  <div className="ad-action-icon">{a.icon}</div>
                  <div className="ad-action-text">
                    <span className="ad-action-label">{a.label}</span>
                    <span className="ad-action-desc">{a.desc}</span>
                  </div>
                  <div className="ad-action-arrow"><IconArrow /></div>
                </button>
              ))}
            </div>
          </div>

          {/* Booking summary mini-panel */}
          <div className="ad-panel">
            <div className="ad-panel-header">
              <span className="ad-panel-title">Booking Summary</span>
              <button className="ad-panel-action">View all <IconArrow /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {[
                { label: "Confirmed", value: Math.round(stats.totalBookings * 0.78), color: "#10B981" },
                { label: "Pending", value: Math.round(stats.totalBookings * 0.14), color: "#F59E0B" },
                { label: "Cancelled", value: Math.round(stats.totalBookings * 0.08), color: "#E63946" },
              ].map((row, i) => {
                const pct = stats.totalBookings > 0
                  ? Math.round((row.value / stats.totalBookings) * 100)
                  : [78, 14, 8][i];
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#6B7280" }}>{row.label}</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#D1D5DB" }}>{row.value}</span>
                    </div>
                    <div style={{ height: "4px", background: "#1A1A24", borderRadius: "99px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: row.color, borderRadius: "99px", transition: "width 0.6s ease" }} />
                    </div>
                  </div>
                );
              })}
              <div style={{ borderTop: "1px solid #1A1A24", paddingTop: "0.85rem", marginTop: "0.4rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.72rem", color: "#4B5563" }}>Total Revenue</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#F59E0B", letterSpacing: "-0.02em" }}>
                    ₹{stats.totalRevenue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Movies */}
        <div className="ad-movies-panel">
          <div className="ad-panel-header">
            <span className="ad-panel-title">Recent Movies</span>
            <button className="ad-panel-action">See all <IconArrow /></button>
          </div>
          {movies.length === 0 ? (
            <div className="ad-empty">No movies yet</div>
          ) : (
            <div className="ad-movie-grid">
              {movies.slice(0, 4).map((movie) => (
                <div key={movie.id} className="ad-movie-card">
                  {movie.banner ? (
                    <img src={movie.banner} alt={movie.title} className="ad-movie-img" />
                  ) : (
                    <div className="ad-movie-placeholder">
                      <IconFilm />
                    </div>
                  )}
                  <div className="ad-movie-body">
                    <div className="ad-movie-title">{movie.title}</div>
                    <div className="ad-movie-lang"><IconGlobe />{movie.language || "—"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}