import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { signupUser } from "../redux/slices/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function SignupPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "USER",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      const signupData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
      };

      const result = await dispatch(signupUser(signupData)).unwrap();
      toast.success("Account created successfully!");

      setTimeout(() => {
        navigate(
          formData.role === "ADMIN" ? "/admin/dashboard" : "/user/browse",
        );
      }, 1000);
    } catch (err) {
      toast.error(err || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎬 CineFlow</h1>
          <p className="text-gray-400">Create Your Account</p>
        </div>

        {/* Signup Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Sign Up</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded border border-gray-700 focus:border-red-600 outline-none transition"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">
                Email Address *
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

            {/* Phone */}
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded border border-gray-700 focus:border-red-600 outline-none transition"
                placeholder="+91 9999999999"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">
                Account Type
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full bg-gray-800 text-white px-4 py-3 rounded border border-gray-700 focus:border-red-600 outline-none transition"
              >
                <option value="USER">👤 Regular User</option>
                <option value="ADMIN">👨‍💼 Admin</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">
                Password *
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
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded border border-gray-700 focus:border-red-600 outline-none transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900 bg-opacity-50 border border-red-700 text-red-200 p-3 rounded text-sm">
                {error}
              </div>
            )}

            {/* Terms & Conditions */}
            <div className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 cursor-pointer"
                required
              />
              <label htmlFor="terms" className="text-gray-400 cursor-pointer">
                I agree to the{" "}
                <a href="#" className="text-red-600 hover:text-red-700">
                  Terms & Conditions
                </a>{" "}
                and{" "}
                <a href="#" className="text-red-600 hover:text-red-700">
                  Privacy Policy
                </a>
              </label>
            </div>

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
              {loading ? "⏳ Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-gray-400 mt-6">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-red-600 hover:text-red-700 font-bold"
            >
              Sign In
            </Link>
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-4">
          <p className="text-blue-200 text-sm">
            🔒 <span className="font-bold">Secure Account:</span> Your data is
            encrypted and protected.
          </p>
        </div>
      </div>
    </div>
  );
}
