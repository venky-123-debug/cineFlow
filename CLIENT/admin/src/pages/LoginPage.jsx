import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: "auth/loading" });
    setSuccessMsg("");

    try {
      if (isLogin) {
        // Admin Sign In
        const res = await axios.post("/api/auth/login", {
          email: form.email,
          password: form.password,
        });

        if (res.data.success) {
          const user = res.data.data;

          // Verify that this is actually an Admin account
          if (user.role !== "ADMIN") {
            dispatch({
              type: "auth/error",
              payload: "Access denied. Not an administrator account.",
            });
            return;
          }

          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(user));
          dispatch({
            type: "auth/login",
            payload: {
              isAuthenticated: true,
              user: user,
              token: res.data.token,
            },
          });
          navigate("/");
        } else {
          dispatch({
            type: "auth/error",
            payload: res.data.message || "Login failed",
          });
        }
      } else {
        // Admin Registration
        const res = await axios.post("/api/auth/admin/register", {
          name: form.name,
          email: form.email,
          password: form.password,
          role: "ADMIN",
        });

        if (res.data.success) {
          setSuccessMsg("Admin registered successfully! Please log in.");
          setIsLogin(true);
          setForm((prev) => ({ ...prev, password: "", name: "" }));
          dispatch({ type: "auth/error", payload: null });
        } else {
          dispatch({
            type: "auth/error",
            payload: res.data.message || "Admin registration failed",
          });
        }
      }
    } catch (err) {
      dispatch({
        type: "auth/error",
        payload: err.response?.data?.message || "Operation failed",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white relative overflow-hidden px-4">
      {/* Decorative colored glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-2xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black bg-linear-to-r from-amber-400 via-orange-400 to-indigo-500 bg-clip-text text-transparent tracking-widest">
            CINEFLOW ADMIN
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Management Portal & Data Console
          </p>
        </div>

        {/* Tab Toggle (Login vs Register) */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800/80 mb-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              dispatch({ type: "auth/error", payload: null });
            }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isLogin ? "bg-amber-600 text-slate-950 font-black shadow-lg" : "text-gray-400 hover:text-white"}`}
          >
            Partner Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              dispatch({ type: "auth/error", payload: null });
            }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isLogin ? "bg-amber-600 text-slate-950 font-black shadow-lg" : "text-gray-400 hover:text-white"}`}
          >
            Admin Sign Up
          </button>
        </div>

        {/* Status Messages */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
            {error}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter admin name"
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-gray-600 transition-all text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@cineflow.com"
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-gray-600 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-gray-600 transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 mt-6 text-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-slate-950"
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
                Processing...
              </span>
            ) : isLogin ? (
              "Access Dashboard"
            ) : (
              "Register Admin Account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
