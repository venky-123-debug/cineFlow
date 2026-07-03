import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../redux/slices/authSlice";

const NAV = [
  { to: "/admin/dashboard", icon: "📊", label: "Dashboard"   },
  { to: "/admin/movies",    icon: "🎬", label: "Movies"      },
  { to: "/admin/theatres",  icon: "🏟️", label: "Theatres"    },
  { to: "/admin/shows",     icon: "🎭", label: "Shows"       },
  { to: "/admin/bookings",  icon: "🎟️", label: "Bookings"    },
];

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user     = useSelector((s) => s.auth.user);

  const handleLogout = () => { dispatch(logoutUser()); navigate("/login"); };

  return (
    <div className="admin-wrap">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <div className="logo">🎬 CineFlow</div>
          <div className="badge">Admin Panel</div>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `admin-nav-item${isActive ? " active" : ""}`}>
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "0 4px" }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%", background: "var(--red)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, flexShrink: 0
            }}>{user?.name?.[0]?.toUpperCase()}</div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: "var(--dim)" }}>Administrator</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-danger btn-full btn-sm">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
