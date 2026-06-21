import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSeatStatus, selectSeat } from "../../redux/slices/showSlice";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function SeatSelection() {
  const { showId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { seatStatus, selectedSeats, loading } = useSelector(
    (state) => state.shows,
  );
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    dispatch(fetchSeatStatus(showId));
  }, [showId]);

  // Calculate total amount based on selected seats
  useEffect(() => {
    if (seatStatus?.seats) {
      let amount = 0;
      selectedSeats.forEach((seatNum) => {
        const seat = seatStatus.seats.find((s) => s.seatNumber === seatNum);
        if (seat) amount += seat.price;
      });
      setTotalAmount(amount);
    }
  }, [selectedSeats, seatStatus]);

  const handleSeatClick = (seat) => {
    if (seat.status === "AVAILABLE") {
      dispatch(selectSeat(seat.seatNumber));
    } else {
      toast.error("Seat is not available");
    }
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat");
      return;
    }
    navigate(`/user/payment/${showId}`, {
      state: { selectedSeats, totalAmount },
    });
  };

  if (loading)
    return <div className="text-white text-center p-6">Loading seats...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Select Seats</h1>

      {/* Movie & Show Info */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-8">
        <h2 className="text-white text-lg mb-2">{seatStatus?.movie?.title}</h2>
        <p className="text-gray-400 flex gap-4">
          <span>🎭 {seatStatus?.theatre?.name}</span>
          <span>⏰ {new Date(seatStatus?.showTime).toLocaleString()}</span>
        </p>
      </div>

      {/* Seat Legend */}
      <div className="flex justify-center gap-8 mb-8 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-green-600 rounded"></div>
          <span className="text-gray-300">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-600 rounded"></div>
          <span className="text-gray-300">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded"></div>
          <span className="text-gray-300">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-yellow-600 rounded"></div>
          <span className="text-gray-300">Premium</span>
        </div>
      </div>

      {/* Screen */}
      <div className="flex justify-center mb-8">
        <div className="bg-gradient-to-b from-transparent to-gray-900 text-white py-4 px-16 rounded-b-3xl border-2 border-gray-600">
          SCREEN
        </div>
      </div>

      {/* Seat Grid */}
      <div className="flex justify-center mb-8 overflow-x-auto">
        <div className="bg-gray-900 p-6 rounded-lg">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(15, 1fr)` }}
          >
            {seatStatus?.seats?.map((seat) => (
              <button
                key={seat.seatNumber}
                onClick={() => handleSeatClick(seat)}
                disabled={seat.status !== "AVAILABLE"}
                className={`w-8 h-8 rounded text-xs font-bold transition ${
                  selectedSeats.includes(seat.seatNumber)
                    ? "bg-blue-600 text-white"
                    : seat.status === "AVAILABLE"
                      ? seat.category === "PREMIUM"
                        ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                }`}
                title={`${seat.seatNumber} - ${seat.category} - ₹${seat.price}`}
              >
                {seat.seatNumber[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 mb-2">Selected Seats</p>
          <p className="text-2xl font-bold text-white">
            {selectedSeats.length}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {selectedSeats.join(", ") || "None"}
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 mb-2">Total Amount</p>
          <p className="text-2xl font-bold text-green-500">₹{totalAmount}</p>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 mb-2">Available</p>
          <p className="text-2xl font-bold text-blue-500">
            {seatStatus?.availableSeats}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded transition font-bold"
        >
          Go Back
        </button>
        <button
          onClick={handleProceed}
          disabled={selectedSeats.length === 0}
          className={`flex-1 py-3 rounded transition font-bold text-white ${
            selectedSeats.length === 0
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
}
