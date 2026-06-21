import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import movieReducer from "./slices/movieSlice";
import showReducer from "./slices/showSlice";
import bookingReducer from "./slices/bookingSlice";
import uiReducer from "./slices/uiSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    movies: movieReducer,
    shows: showReducer,
    bookings: bookingReducer,
    ui: uiReducer,
  },
});

export default store;
