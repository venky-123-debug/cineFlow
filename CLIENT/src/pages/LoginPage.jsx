import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../redux/slices/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const result = await dispatch(loginUser(formData)).unwrap();
      toast.success("Login successful!");

      // Redirect based on role
      setTimeout(() => {
        navigate(
          result.user?.role === "ADMIN" ? "/admin/dashboard" : "/user/browse",
        );
      }, 1000);
    } catch (err) {
      toast.error(err || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎬 CineFlow</h1>
          <p className="text-gray-400">Your Ultimate Movie Booking Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded border border-gray-700 focus:border-red-600 outline-none transition"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded border border-gray-700 focus:border-red-600 outline-none transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 p-3 rounded text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded font-bold text-white transition mt-6 ${
                loading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loading ? "⏳ Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">OR</span>
            </div>
          </div>

          {/* Demo Logins */}
          <div className="space-y-2 mb-6">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  email: "admin@cineflow.com",
                  password: "admin123",
                });
              }}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded border border-gray-700 transition text-sm"
            >
              👨‍💼 Demo Admin Account
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  email: "user@cineflow.com",
                  password: "user123",
                });
              }}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded border border-gray-700 transition text-sm"
            >
              👤 Demo User Account
            </button>
          </div>

          {/* Signup Link */}
          <p className="text-center text-gray-400">
            New to CineFlow?{" "}
            <Link
              to="/signup"
              className="text-red-600 hover:text-red-700 font-bold"
            >
              Create an account
            </Link>
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {["🎬 Movies", "🎫 Bookings", "💳 Payments"].map((feature) => (
            <div key={feature} className="text-gray-400 text-sm">
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
