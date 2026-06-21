import React from "react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const user = useSelector((state) => state.auth.user);
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);

  const adminLinks = [
    { name: "Dashboard", path: "/admin/dashboard", icon: "📊" },
    { name: "Movies", path: "/admin/movies", icon: "🎬" },
    { name: "Shows", path: "/admin/shows", icon: "🎭" },
    { name: "Bookings", path: "/admin/bookings", icon: "🎫" },
    { name: "Analytics", path: "/admin/analytics", icon: "📈" },
  ];

  const userLinks = [
    { name: "Browse", path: "/user/browse", icon: "🎬" },
    { name: "My Bookings", path: "/user/bookings", icon: "🎫" },
    { name: "Profile", path: "/user/profile", icon: "👤" },
  ];

  const links = user?.role === "ADMIN" ? adminLinks : userLinks;

  return (
    <aside
      className={`fixed left-0 top-16 h-screen bg-gray-900 text-white shadow-lg transition-all duration-300 ${sidebarOpen ? "w-64" : "w-0"} overflow-hidden lg:w-64 lg:static lg:top-0`}
    >
      <div className="p-6 space-y-2">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `block px-4 py-3 rounded transition ${
                isActive ? "bg-red-600 text-white" : "hover:bg-gray-800"
              }`
            }
          >
            <span className="mr-2">{link.icon}</span>
            {link.name}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
