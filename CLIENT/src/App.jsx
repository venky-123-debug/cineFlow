import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Auth Pages
import LoginPage  from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

// Common
import ProtectedRoute from "./components/common/ProtectedRoute";

// Admin
import AdminLayout       from "./components/admin/AdminLayout";
import Dashboard         from "./components/admin/Dashboard";
import MovieManagement   from "./components/admin/MovieManagement";
import TheatreManagement from "./components/admin/TheatreManagement";
import ShowManagement    from "./components/admin/ShowManagement";
import BookingsManagement from "./components/admin/BookingsManagement";

// User
import Navbar             from "./components/common/Navbar";
import HomePage           from "./components/user/HomePage";
import MovieDetailPage    from "./components/user/MovieDetailPage";
import SeatSelection      from "./components/user/SeatSelection";
import PaymentModal       from "./components/user/PaymentModal";
import BookingConfirmation from "./components/user/BookingConfirmation";
import MyBookings         from "./components/user/MyBookings";

function UserLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function App() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"  element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Admin — AdminLayout renders <Outlet /> for nested routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="movies"    element={<MovieManagement />} />
          <Route path="theatres"  element={<TheatreManagement />} />
          <Route path="shows"     element={<ShowManagement />} />
          <Route path="bookings"  element={<BookingsManagement />} />
          <Route path="*"         element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* User */}
        <Route path="/home"
          element={<ProtectedRoute requiredRole="USER"><UserLayout><HomePage /></UserLayout></ProtectedRoute>}
        />
        <Route path="/movie/:movieId"
          element={<ProtectedRoute requiredRole="USER"><UserLayout><MovieDetailPage /></UserLayout></ProtectedRoute>}
        />
        <Route path="/seats/:showId"
          element={<ProtectedRoute requiredRole="USER"><UserLayout><SeatSelection /></UserLayout></ProtectedRoute>}
        />
        <Route path="/payment/:showId"
          element={<ProtectedRoute requiredRole="USER"><UserLayout><PaymentModal /></UserLayout></ProtectedRoute>}
        />
        <Route path="/confirmation/:bookingId"
          element={<ProtectedRoute requiredRole="USER"><UserLayout><BookingConfirmation /></UserLayout></ProtectedRoute>}
        />
        <Route path="/my-bookings"
          element={<ProtectedRoute requiredRole="USER"><UserLayout><MyBookings /></UserLayout></ProtectedRoute>}
        />

        {/* Root */}
        <Route path="/" element={
          isAuthenticated
            ? <Navigate to={user?.role === "ADMIN" ? "/admin/dashboard" : "/home"} replace />
            : <Navigate to="/login" replace />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer position="bottom-right" autoClose={3000} theme="dark" newestOnTop />
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
    </BrowserRouter>
  );
}
