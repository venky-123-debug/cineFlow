import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
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
        // Customer login
        const res = await axios.post("/api/auth/login", {
          email: form.email,
          password: form.password,
        });

        if (res.data.success) {
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.data));
          dispatch({
            type: "auth/login",
            payload: {
              isAuthenticated: true,
              user: res.data.data,
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
        // Customer registration
        const res = await axios.post("/api/auth/user/signup", {
          name: form.name,
          email: form.email,
          password: form.password,
          role: "USER"
        });

        if (res.data.success) {
          setSuccessMsg("Signup successful! Please log in.");
          setIsLogin(true);
          setForm(prev => ({ ...prev, password: "", name: "" }));
          dispatch({ type: "auth/error", payload: null });
        } else {
          dispatch({
            type: "auth/error",
            payload: res.data.message || "Registration failed",
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

  const handleGoogleSuccess = async (credentialResponse) => {
    dispatch({ type: "auth/loading" });
    setSuccessMsg("");
    try {
      const res = await axios.post("/api/auth/google", {
        idToken: credentialResponse.credential,
      });
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.data));
        dispatch({
          type: "auth/login",
          payload: {
            isAuthenticated: true,
            user: res.data.data,
            token: res.data.token,
          },
        });
        navigate("/");
      } else {
        dispatch({
          type: "auth/error",
          payload: res.data.message || "Google login failed",
        });
      }
    } catch (err) {
      dispatch({
        type: "auth/error",
        payload: err.response?.data?.message || "Google login failed",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white relative overflow-hidden px-4">
      {/* Decorative colored glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-2xl">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent tracking-widest">
            CINEFLOW
          </h1>
          <p className="text-sm text-gray-400 mt-1">Book your favorite movie tickets instantly</p>
        </div>

        {/* Tab Toggle (Login vs Register) */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800/80 mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); dispatch({ type: "auth/error", payload: null }); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isLogin ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); dispatch({ type: "auth/error", payload: null }); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isLogin ? "bg-indigo-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
          >
            Register
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
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-gray-600 transition-all text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@example.com"
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-gray-600 transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-gray-600 transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-6 text-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Divider & Social Login */}
        {isLogin && (
          <>
            <div className="flex items-center my-6">
              <div className="flex-1 h-[1px] bg-slate-800"></div>
              <span className="px-4 text-xs font-semibold text-gray-500 uppercase">Or continue with</span>
              <div className="flex-1 h-[1px] bg-slate-800"></div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  dispatch({ type: "auth/error", payload: "Google login failed" })
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
