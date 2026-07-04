import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createOrder, verifyPayment } from "../../redux/slices/bookingSlice";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import crypto from "crypto-js";

export default function PaymentModal() {
  const { showId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentOrder, paymentLoading } = useSelector(
    (state) => state.bookings,
  );
  const { seatStatus } = useSelector((state) => state.shows);

  const { selectedSeats, totalAmount } = location.state || {};
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedSeats || selectedSeats.length === 0) {
      navigate(-1);
      return;
    }
    // Create order
    dispatch(createOrder({ showId, seats: selectedSeats, totalAmount }));
  }, []);

  const handlePayment = async () => {
    if (!currentOrder) {
      toast.error("Order not created. Please try again.");
      return;
    }

    const options = {
      key: import.meta.env.REACT_APP_RAZORPAY_KEY_ID,
      order_id: currentOrder.orderId,
      amount: currentOrder.amount,
      currency: "INR",
      name: "CineFlow",
      description: `Movie Booking - ${selectedSeats.length} seats`,
      prefill: {
        email: "user@example.com",
        contact: "9999999999",
      },
      handler: async (response) => {
        setLoading(true);
        try {
          // Verify payment
          await dispatch(
            verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              showId,
              seats: selectedSeats,
              totalAmount,
            }),
          ).unwrap();

          toast.success("Payment successful! Booking confirmed.");
          setTimeout(() => {
            navigate("/user/bookings");
          }, 2000);
        } catch (error) {
          toast.error(error || "Payment verification failed");
        } finally {
          setLoading(false);
        }
      },
      theme: {
        color: "#E50914",
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Complete Payment</h1>

      {/* Order Details */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-8">
        <div className="space-y-4">
          <div className="flex justify-between text-gray-300">
            <span>Movie:</span>
            <span className="text-white font-bold">
              {seatStatus?.movie?.title}
            </span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Theatre:</span>
            <span className="text-white font-bold">
              {seatStatus?.theatre?.name}
            </span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Show Date:</span>
            <span className="text-white font-bold">
              {new Date(seatStatus?.showTime).toLocaleString()}
            </span>
          </div>
          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="flex justify-between text-gray-300 mb-2">
              <span>Seats:</span>
              <span className="text-white font-bold">
                {selectedSeats?.join(", ")}
              </span>
            </div>
            <div className="flex justify-between text-gray-300 mb-2">
              <span>Quantity:</span>
              <span className="text-white font-bold">
                {selectedSeats?.length} tickets
              </span>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-4 mt-4 flex justify-between">
            <span className="text-lg text-gray-300">Total Amount:</span>
            <span className="text-3xl font-bold text-green-500">
              ₹{totalAmount}
            </span>
          </div>
        </div>
      </div>

      {/* Ticket Variations Info */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-8">
        <h2 className="text-white font-bold mb-4">📋 Ticket Categories</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-800 rounded">
            <div>
              <p className="text-white font-bold">🌟 Premium Seats</p>
              <p className="text-gray-400 text-sm">
                Middle rows (Best viewing)
              </p>
            </div>
            <p className="text-yellow-400 font-bold">₹250</p>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-800 rounded">
            <div>
              <p className="text-white font-bold">⭐ Standard Seats</p>
              <p className="text-gray-400 text-sm">Good view & sound</p>
            </div>
            <p className="text-blue-400 font-bold">₹200</p>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-800 rounded">
            <div>
              <p className="text-white font-bold">✨ Economy Seats</p>
              <p className="text-gray-400 text-sm">Front & back rows</p>
            </div>
            <p className="text-green-400 font-bold">₹150</p>
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-8">
        <h2 className="text-white font-bold mb-4">🎬 Theatre Amenities</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            "4K Projection",
            "Dolby Sound",
            "Recliners",
            "AC Hall",
            "Wheelchair Access",
            "Parking",
          ].map((amenity) => (
            <div
              key={amenity}
              className="bg-gray-800 p-3 rounded text-center text-gray-300 text-sm"
            >
               {amenity}
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-8">
        <h2 className="text-white font-bold mb-4">💳 Payment Methods</h2>
        <p className="text-gray-400 text-sm mb-4">
          We accept all major payment methods via Razorpay
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            "Credit Card",
            "Debit Card",
            "UPI",
            "Wallet",
            "NetBanking",
            "PayLater",
          ].map((method) => (
            <div
              key={method}
              className="bg-gray-800 p-3 rounded text-center text-gray-300 text-sm hover:border-red-600 border border-gray-700 transition"
            >
              {method}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded transition font-bold"
        >
          Back
        </button>
        <button
          onClick={handlePayment}
          disabled={paymentLoading || loading || !currentOrder}
          className={`flex-1 py-3 rounded transition font-bold text-white ${
            paymentLoading || loading || !currentOrder
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {loading || paymentLoading ? "Processing..." : "Pay with Razorpay"}
        </button>
      </div>

      {/* Script for Razorpay */}
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </div>
  );
}
