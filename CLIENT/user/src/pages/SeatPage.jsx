import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function SeatPage() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const [seatData, setSeatData] = useState(null);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await axios.get(
        `http://localhost:5000/api/shows/${showId}/seats`,
        { headers: { "access-token": localStorage.getItem("token") } },
      );
      setSeatData(res.data.data);
    };
    load();
  }, [showId]);

  if (!seatData) return <div className="p-6">Loading seats...</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold">Select Seats</h2>
      <div className="flex flex-wrap gap-2 mt-4">
        {seatData.seats.map((seat) => (
          <button
            key={seat.seatNumber}
            disabled={seat.status !== "AVAILABLE"}
            onClick={() =>
              setSelected((prev) =>
                prev.includes(seat.seatNumber)
                  ? prev.filter((s) => s !== seat.seatNumber)
                  : [...prev, seat.seatNumber],
              )
            }
            className={`px-3 py-2 rounded ${selected.includes(seat.seatNumber) ? "bg-red-500" : "bg-slate-700"} ${seat.status !== "AVAILABLE" ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-600"}`}
          >
            {seat.seatNumber}
          </button>
        ))}
      </div>
      <button
        onClick={() => navigate("/my-bookings")}
        className="mt-4 px-4 py-2 rounded bg-indigo-600"
      >
        Confirm
      </button>
    </div>
  );
}
