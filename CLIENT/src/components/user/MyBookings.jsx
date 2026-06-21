import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserBookings } from "../../redux/slices/bookingSlice";
import { useState } from "react";

export default function MyBookings() {
  const dispatch = useDispatch();
  const { bookings, loading } = useSelector((state) => state.bookings);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    dispatch(fetchUserBookings());
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "CONFIRM":
        return "bg-green-600";
      case "PENDING":
        return "bg-yellow-600";
      case "CANCEL":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">My Bookings</h1>

      {loading ? (
        <div className="text-center text-gray-400">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p className="text-2xl mb-4">📭 No bookings yet</p>
          <a href="/user/browse" className="text-red-600 hover:text-red-700">
            Browse movies and book tickets →
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-red-600 transition"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                {/* Movie Info */}
                <div>
                  <p className="text-gray-400 text-sm">Movie</p>
                  <p className="text-white font-bold text-lg">
                    {booking.movieId?.title || "Movie Name"}
                  </p>
                </div>

                {/* Booking Details */}
                <div>
                  <p className="text-gray-400 text-sm">Seats</p>
                  <p className="text-white font-bold">
                    {booking.seats?.join(", ")}
                  </p>
                </div>

                {/* Amount */}
                <div>
                  <p className="text-gray-400 text-sm">Amount</p>
                  <p className="text-green-500 font-bold text-lg">
                    ₹{booking.totalAmount}
                  </p>
                </div>

                {/* Status & Actions */}
                <div className="flex flex-col gap-2">
                  <span
                    className={`text-white px-3 py-1 rounded text-sm font-bold ${getStatusColor(booking.status)}`}
                  >
                    {booking.status}
                  </span>
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                  >
                    View Ticket
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">🎫 Ticket</h2>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Ticket Design */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg p-6 mb-6">
              <div className="text-white space-y-4">
                <div className="border-b border-gray-600 pb-4">
                  <h3 className="text-2xl font-bold">
                    {selectedBooking.movieId?.title}
                  </h3>
                  <p className="text-gray-300">🎬 Cinema Name • Screen 1</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Date & Time</p>
                    <p className="font-bold">22 Jun 2026 | 7:30 PM</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Seats</p>
                    <p className="font-bold">
                      {selectedBooking.seats?.join(", ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Ticket ID</p>
                    <p className="font-bold text-sm">
                      {selectedBooking.ticketId}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Amount Paid</p>
                    <p className="font-bold text-green-500">
                      ₹{selectedBooking.totalAmount}
                    </p>
                  </div>
                </div>

                {/* QR Code Placeholder */}
                <div className="border-t border-gray-600 pt-4 text-center">
                  <div className="bg-white p-4 rounded inline-block mb-2">
                    <div className="w-32 h-32 bg-gray-400 flex items-center justify-center">
                      [QR Code]
                    </div>
                  </div>
                  <p className="text-gray-300 text-xs">
                    Show this at the counter
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded transition font-bold">
                📥 Download Ticket
              </button>
              <button className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition font-bold">
                📧 Email Ticket
              </button>
              <button
                onClick={() => setSelectedBooking(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
