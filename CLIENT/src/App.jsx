import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Auth & Pages
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

// Common Components
import ProtectedRoute from "./components/common/ProtectedRoute";

// Admin Components
import Dashboard from "./components/admin/Dashboard";
import MovieManagement from "./components/admin/MovieManagement";
import ShowManagement from "./components/admin/ShowManagement";

// User Components
import MovieBrowser from "./components/user/MovieBrowser";
import SeatSelection from "./components/user/SeatSelection";
import PaymentModal from "./components/user/PaymentModal";
import BookingConfirmation from "./components/user/BookingConfirmation";
import MyBookings from "./components/user/MyBookings";

// Import auth slice to check token on mount
// import { useAuth } from "./redux/slices/authSlice";

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);


  // Check for stored token on app mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser && !isAuthenticated) {
      // User will be restored from localStorage by the auth slice
      // This ensures user remains logged in on page refresh
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="movies" element={<MovieManagement />} />
                <Route path="shows" element={<ShowManagement />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* User Routes */}
        <Route
          path="/user/*"
          element={
            <ProtectedRoute requiredRole="USER">
              <Routes>
                <Route path="browse" element={<MovieBrowser />} />
                <Route path="movie/:movieId" element={<MovieBrowser />} />
                <Route path="seats/:showId" element={<SeatSelection />} />
                <Route path="payment/:showId" element={<PaymentModal />} />
                <Route
                  path="confirmation/:bookingId"
                  element={<BookingConfirmation />}
                />
                <Route path="bookings" element={<MyBookings />} />
                <Route path="*" element={<Navigate to="/user/browse" />} />
              </Routes>
            </ProtectedRoute>
          }
        />

        {/* Root Route */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate
                to={
                  user?.role === "ADMIN" ? "/admin/dashboard" : "/user/browse"
                }
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Toast Notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
    </BrowserRouter>
  );
}
