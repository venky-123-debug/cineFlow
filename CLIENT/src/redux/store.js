import { configureStore } from "@reduxjs/toolkit";
import authReducer    from "./slices/authSlice";
import movieReducer   from "./slices/movieSlice";
import showReducer    from "./slices/showSlice";
import bookingReducer from "./slices/bookingSlice";
import theatreReducer from "./slices/theatreSlice";
import uiReducer      from "./slices/uiSlice";

const store = configureStore({
  reducer: {
    auth:     authReducer,
    movies:   movieReducer,
    shows:    showReducer,
    bookings: bookingReducer,
    theatres: theatreReducer,
    ui:       uiReducer,
  },
});

export default store;
