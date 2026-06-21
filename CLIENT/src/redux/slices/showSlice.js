import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchShows = createAsyncThunk(
  "shows/fetchShows",
  async ({ movieId = "", theatreId = "" }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (movieId) params.append("movieId", movieId);
      if (theatreId) params.append("theatreId", theatreId);
      const response = await api.get(`/api/shows?${params}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch shows",
      );
    }
  },
);

export const fetchShowById = createAsyncThunk(
  "shows/fetchShowById",
  async (showId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/shows/${showId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch show",
      );
    }
  },
);

export const fetchSeatStatus = createAsyncThunk(
  "shows/fetchSeatStatus",
  async (showId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/shows/${showId}/seats`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch seat status",
      );
    }
  },
);

export const createShow = createAsyncThunk(
  "shows/createShow",
  async (showData, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/shows", showData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create show",
      );
    }
  },
);

const initialState = {
  shows: [],
  currentShow: null,
  seatStatus: null,
  loading: false,
  error: null,
  selectedSeats: [],
};

const showSlice = createSlice({
  name: "shows",
  initialState,
  reducers: {
    selectSeat: (state, action) => {
      const seatNumber = action.payload;
      if (state.selectedSeats.includes(seatNumber)) {
        state.selectedSeats = state.selectedSeats.filter(
          (s) => s !== seatNumber,
        );
      } else {
        state.selectedSeats.push(seatNumber);
      }
    },
    clearSelectedSeats: (state) => {
      state.selectedSeats = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShows.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShows.fulfilled, (state, action) => {
        state.loading = false;
        state.shows = action.payload;
      })
      .addCase(fetchShows.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchShowById.fulfilled, (state, action) => {
        state.currentShow = action.payload;
      })
      .addCase(fetchSeatStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSeatStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.seatStatus = action.payload;
      })
      .addCase(fetchSeatStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { selectSeat, clearSelectedSeats } = showSlice.actions;
export default showSlice.reducer;
