import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const createOrder = createAsyncThunk(
  "bookings/createOrder",
  async ({ showId, seats, totalAmount }, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/bookings", {
        showId,
        seats,
        totalAmount,
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create order",
      );
    }
  },
);

export const verifyPayment = createAsyncThunk(
  "bookings/verifyPayment",
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await api.post(
        "/api/bookings/verify-payment",
        paymentData,
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Payment verification failed",
      );
    }
  },
);

export const fetchUserBookings = createAsyncThunk(
  "bookings/fetchUserBookings",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/api/bookings/my-bookings");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch bookings",
      );
    }
  },
);

const initialState = {
  bookings: [],
  currentOrder: null,
  currentBooking: null,
  loading: false,
  paymentLoading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(verifyPayment.pending, (state) => {
        state.paymentLoading = true;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.paymentLoading = false;
        state.currentBooking = action.payload;
        state.bookings.push(action.payload);
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.paymentLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.bookings = action.payload;
      });
  },
});

export const { clearCurrentOrder, clearError } = bookingSlice.actions;
export default bookingSlice.reducer;
