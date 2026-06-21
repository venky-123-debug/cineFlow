import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toggleSidebar } from "../../redux/slices/uiSlice";
import { logoutUser } from "../../redux/slices/authSlice";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const sidebarOpen = useSelector((state) => state.ui.sidebarOpen);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  return (
    <nav className="bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden p-2 hover:bg-red-700 rounded"
          >
            ☰
          </button>
          <h1 className="text-2xl font-bold">🎬 CineFlow</h1>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-sm">{user?.name}</span>
          <span className="text-xs bg-red-700 px-3 py-1 rounded-full">
            {user?.role}
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-700 hover:bg-red-900 px-4 py-2 rounded transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
