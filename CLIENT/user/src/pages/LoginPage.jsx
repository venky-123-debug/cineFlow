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
          role: "USER",
        });

        if (res.data.success) {
          setSuccessMsg("Signup successful! Please log in.");
          setIsLogin(true);
          setForm((prev) => ({ ...prev, password: "", name: "" }));
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
    <div className="min-h-screen flex items-center justify-center text-white relative overflow-hidden px-4">
      {/* Dynamic cinema light beam overlays */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-rose-500/10 via-transparent to-transparent blur-3xl pointer-events-none -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-100px] right-[-50px] w-96 h-96 bg-rose-500/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute top-[-100px] left-[-50px] w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900/40 border border-zinc-850 backdrop-blur-md shadow-2xl relative z-10 transition-all duration-300">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black bg-linear-to-r from-rose-500 via-red-500 to-pink-600 bg-clip-text text-transparent tracking-widest flex items-center justify-center gap-2 drop-shadow-[0_2px_10px_rgba(244,63,94,0.15)] uppercase">
            <svg
              className="w-7 h-7 text-rose-500"
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
          </h1>
          <p className="text-[10px] text-zinc-400 mt-2 font-bold uppercase tracking-wider">
            Book your favorite movie tickets instantly
          </p>
        </div>

        {/* Tab Toggle (Login vs Register) */}
        <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900/80 mb-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              dispatch({ type: "auth/error", payload: null });
            }}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-350 ${isLogin ? "bg-rose-600 text-white shadow-md shadow-rose-600/10" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              dispatch({ type: "auth/error", payload: null });
            }}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-350 ${!isLogin ? "bg-rose-600 text-white shadow-md shadow-rose-600/10" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Register
          </button>
        </div>

        {/* Status Messages */}
        {successMsg && (
          <div className="mb-4.5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wide">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-4.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs font-bold uppercase tracking-wide">
            {error}
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-[10px] font-black text-zinc-500 mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full p-3 rounded-2xl bg-zinc-950 border border-zinc-850 text-zinc-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder-zinc-700 transition-all text-xs font-medium"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-zinc-500 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@example.com"
              className="w-full p-3 rounded-2xl bg-zinc-950 border border-zinc-850 text-zinc-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder-zinc-700 transition-all text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-zinc-500 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="w-full p-3 rounded-2xl bg-zinc-950 border border-zinc-850 text-zinc-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 placeholder-zinc-700 transition-all text-xs font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
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
              <div className="flex-1 h-[1px] bg-zinc-900"></div>
              <span className="px-4 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                Or continue with
              </span>
              <div className="flex-1 h-[1px] bg-zinc-900"></div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() =>
                  dispatch({
                    type: "auth/error",
                    payload: "Google login failed",
                  })
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
