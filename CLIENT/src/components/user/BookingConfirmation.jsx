import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentBooking, loading } = useSelector((state) => state.bookings);

  useEffect(() => {
    if (!currentBooking) {
      // Redirect if no booking
      setTimeout(() => navigate("/user/bookings"), 2000);
    }
  }, [currentBooking]);

  const handleDownloadTicket = () => {
    const qrcodeElement = document.getElementById("qrcode");
    const canvas = qrcodeElement.querySelector("canvas");
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `ticket-${currentBooking?.ticketId}.png`;
    link.click();
  };

  if (loading || !currentBooking) {
    return (
      <div className="p-6 text-center">
        <div className="text-white text-xl">Loading your ticket...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-12 mb-8 text-white text-center">
        <p className="text-5xl mb-4">✅</p>
        <h1 className="text-4xl font-bold mb-2">Booking Confirmed!</h1>
        <p className="text-lg opacity-90">
          Your ticket has been reserved successfully
        </p>
      </div>

      {/* Main Ticket */}
      <div className="bg-gray-900 border-4 border-red-600 rounded-lg p-8 mb-8 shadow-2xl">
        {/* Header */}
        <div className="border-b-2 border-red-600 pb-6 mb-6">
          <h2 className="text-4xl font-bold text-white mb-2">
            🎬 CineFlow Ticket
          </h2>
          <p className="text-red-500 font-bold">#{currentBooking.ticketId}</p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Side - Movie Details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-white text-3xl font-bold mb-2">
                {currentBooking.movieId?.title}
              </h3>
              <p className="text-gray-400">
                🎭 {currentBooking.theatreId?.name}
              </p>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">📅 Date</span>
                <span className="text-white font-bold">
                  {new Date(
                    currentBooking.showId?.showDate,
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">⏰ Time</span>
                <span className="text-white font-bold">
                  {new Date(
                    currentBooking.showId?.showTime,
                  ).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">🎫 Seats</span>
                <span className="text-white font-bold">
                  {currentBooking.seats?.join(", ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">👥 Tickets</span>
                <span className="text-white font-bold">
                  {currentBooking.seats?.length}
                </span>
              </div>
              <div className="border-t border-gray-700 pt-3 flex justify-between">
                <span className="text-gray-400 font-bold">Total Amount</span>
                <span className="text-green-500 font-bold text-xl">
                  ₹{currentBooking.totalAmount}
                </span>
              </div>
            </div>

            {/* Booking Info */}
            <div className="bg-blue-900 bg-opacity-50 border border-blue-500 p-4 rounded-lg">
              <p className="text-blue-200 text-sm">
                <span className="font-bold">📌 Note:</span> Please arrive 15
                minutes before show time. Bring valid ID if required.
              </p>
            </div>
          </div>

          {/* Right Side - QR Code */}
          <div className="flex flex-col items-center justify-center bg-gray-800 rounded-lg p-8">
            <p className="text-white mb-4 font-bold text-lg">Scan to verify</p>
            <div id="qrcode" className="bg-white p-4 rounded-lg mb-4">
              <QRCodeCanvas
                value={`CineFlow-${currentBooking.ticketId}`}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-gray-400 text-center text-sm">
              Show this QR code at the counter
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-red-600 mt-8 pt-6 flex justify-between items-center text-gray-400 text-sm">
          <p>Transaction ID: {currentBooking.orderId}</p>
          <p>
            Payment Status:{" "}
            <span className="text-green-500 font-bold"> Confirmed</span>
          </p>
        </div>
      </div>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">🎬 Screen</p>
          <p className="text-white font-bold text-xl">
            Screen {currentBooking.showId?.screenNumber || "1"}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">🍿 Services</p>
          <p className="text-white font-bold">Food & Beverages</p>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">♿ Facilities</p>
          <p className="text-white font-bold">AC • Parking</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={handleDownloadTicket}
          className="flex-1 min-w-48 bg-red-600 hover:bg-red-700 text-white py-3 rounded transition font-bold"
        >
          📥 Download Ticket
        </button>
        <button className="flex-1 min-w-48 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded transition font-bold">
          📧 Email Ticket
        </button>
        <button
          onClick={() => navigate("/user/bookings")}
          className="flex-1 min-w-48 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded transition font-bold"
        >
          📋 My Bookings
        </button>
        <button
          onClick={() => navigate("/user/browse")}
          className="flex-1 min-w-48 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded transition font-bold"
        >
          🎬 Browse More
        </button>
      </div>

      {/* Help Section */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mt-8">
        <h3 className="text-white font-bold mb-4">❓ Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300 text-sm">
          <div>
            <p className="font-bold text-white mb-1">📞 Call Us</p>
            <p>+91 1234567890</p>
          </div>
          <div>
            <p className="font-bold text-white mb-1">✉️ Email</p>
            <p>support@cineflow.com</p>
          </div>
          <div>
            <p className="font-bold text-white mb-1">💬 Chat</p>
            <p>Available 24/7</p>
          </div>
        </div>
      </div>
    </div>
  );
}
