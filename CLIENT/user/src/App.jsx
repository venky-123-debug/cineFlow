import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from './pages/LoginPage';
import MoviesPage from './pages/MoviesPage';
import MovieDetailPage from './pages/MovieDetailPage';
import SeatPage from './pages/SeatPage';
import BookingsPage from './pages/BookingsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'USER') return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
      } />
      <Route path="/" element={<ProtectedRoute><MoviesPage /></ProtectedRoute>} />
      <Route path="/movie/:movieId" element={<ProtectedRoute><MovieDetailPage /></ProtectedRoute>} />
      <Route path="/seat/:showId" element={<ProtectedRoute><SeatPage /></ProtectedRoute>} />
      <Route path="/my-bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
