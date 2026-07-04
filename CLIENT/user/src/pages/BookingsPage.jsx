import React, { useEffect, useState } from "react";
import axios from "axios";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await axios.get("http://localhost:5000/api/bookings", {
        headers: { "access-token": localStorage.getItem("token") },
      });
      setBookings(res.data.data || []);
    };
    load();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold">My Bookings</h2>
      {bookings.map((booking) => (
        <div key={booking._id} className="bg-slate-800 p-3 rounded-lg mt-2">
          <div>Status: {booking.status}</div>
          <div>Seats: {booking.seats?.join(", ")}</div>
        </div>
      ))}
    </div>
  );
}
