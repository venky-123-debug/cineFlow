import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch({ type: "auth/logout" });
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      {/* Brand */}
      <Link
        to="/"
        className="text-2xl font-bold bg-linear-to-r from-amber-400 via-orange-400 to-indigo-500 bg-clip-text text-transparent tracking-wider hover:opacity-90 transition-opacity"
      >
        CINEFLOW ADMIN
      </Link>

      {/* Nav Links & Actions */}
      <div className="flex items-center gap-4 text-sm">
        {/* User profile & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-white font-medium text-xs">{user?.name}</span>
            <span className="text-amber-400 text-[10px] uppercase font-bold tracking-wider">
              {user?.role}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-full hover:bg-slate-800 text-gray-400 hover:text-red-400 transition-colors"
            title="Sign Out"
          >
            <svg
              className="w-5 h-5"
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
