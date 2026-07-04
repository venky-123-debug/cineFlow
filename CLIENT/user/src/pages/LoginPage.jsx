import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    dispatch({ type: "auth/loading" });
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        form,
      );
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
    } catch (err) {
      dispatch({
        type: "auth/error",
        payload: err.response?.data?.message || "Login failed",
      });
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    dispatch({ type: "auth/loading" });
    try {
      const res = await axios.post("http://localhost:5000/api/auth/google", {
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
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="w-[360px] p-6 rounded-lg bg-slate-800">
        <h2 className="mb-4">User Login</h2>
        <form onSubmit={handleEmailLogin}>
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            className="w-full mb-3 p-2.5 rounded bg-slate-700"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Password"
            className="w-full mb-3 p-2.5 rounded bg-slate-700"
          />
          {error && <div className="text-red-300 mb-3">{error}</div>}
          <button
            disabled={loading}
            className="w-full py-2 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 mb-3"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
        <div className="my-2 text-center">or</div>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() =>
            dispatch({ type: "auth/error", payload: "Google login failed" })
          }
        />
      </div>
    </div>
  );
}
