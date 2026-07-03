import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchShows = createAsyncThunk(
  "shows/fetchShows",
  async ({ movieId = "", theatreId = "", city = "" } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (movieId)   params.append("movieId", movieId);
      if (theatreId) params.append("theatreId", theatreId);
      if (city)      params.append("city", city);
      const response = await api.get(`/api/shows?${params}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch shows");
    }
  }
);

export const fetchShowById = createAsyncThunk(
  "shows/fetchShowById",
  async (showId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/shows/${showId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch show");
    }
  }
);

export const fetchSeatStatus = createAsyncThunk(
  "shows/fetchSeatStatus",
  async (showId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/shows/${showId}/seats`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch seat status");
    }
  }
);

export const fetchSchedule = createAsyncThunk(
  "shows/fetchSchedule",
  async ({ movieId, city, date }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ movieId, city });
      if (date) params.append("date", date);
      const response = await api.get(`/api/shows/schedule?${params}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch schedule");
    }
  }
);

export const lockSeats = createAsyncThunk(
  "shows/lockSeats",
  async ({ showId, seats }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/shows/${showId}/lock`, { seats });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to lock seats");
    }
  }
);

export const createShow = createAsyncThunk(
  "shows/createShow",
  async (showData, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/shows", showData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create show");
    }
  }
);

export const updateShow = createAsyncThunk(
  "shows/updateShow",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/shows/${id}`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update show");
    }
  }
);

export const deleteShow = createAsyncThunk(
  "shows/deleteShow",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/shows/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete show");
    }
  }
);

const initialState = {
  shows: [],
  currentShow: null,
  seatStatus: null,
  schedule: [],
  loading: false,
  scheduleLoading: false,
  lockLoading: false,
  error: null,
  selectedSeats: [],
};

const showSlice = createSlice({
  name: "shows",
  initialState,
  reducers: {
    selectSeat: (state, action) => {
      const seat = action.payload;
      if (state.selectedSeats.includes(seat)) {
        state.selectedSeats = state.selectedSeats.filter(s => s !== seat);
      } else {
        state.selectedSeats.push(seat);
      }
    },
    clearSelectedSeats: (state) => { state.selectedSeats = []; },
    clearSchedule: (state) => { state.schedule = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShows.pending,   (s) => { s.loading = true; s.error = null; })
      .addCase(fetchShows.fulfilled, (s, a) => { s.loading = false; s.shows = a.payload; })
      .addCase(fetchShows.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchShowById.fulfilled, (s, a) => { s.currentShow = a.payload; })
      .addCase(fetchSeatStatus.pending,   (s) => { s.loading = true; })
      .addCase(fetchSeatStatus.fulfilled, (s, a) => { s.loading = false; s.seatStatus = a.payload; })
      .addCase(fetchSeatStatus.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchSchedule.pending,   (s) => { s.scheduleLoading = true; })
      .addCase(fetchSchedule.fulfilled, (s, a) => { s.scheduleLoading = false; s.schedule = a.payload; })
      .addCase(fetchSchedule.rejected,  (s, a) => { s.scheduleLoading = false; })
      .addCase(lockSeats.pending,   (s) => { s.lockLoading = true; })
      .addCase(lockSeats.fulfilled, (s) => { s.lockLoading = false; })
      .addCase(lockSeats.rejected,  (s) => { s.lockLoading = false; })
      .addCase(createShow.fulfilled, (s, a) => { s.shows.unshift(a.payload); })
      .addCase(updateShow.fulfilled, (s, a) => {
        const i = s.shows.findIndex(sh => sh.id === a.payload.id);
        if (i !== -1) s.shows[i] = a.payload;
      })
      .addCase(deleteShow.fulfilled, (s, a) => {
        s.shows = s.shows.filter(sh => sh.id !== a.payload);
      });
  },
});

export const { selectSeat, clearSelectedSeats, clearSchedule } = showSlice.actions;
export default showSlice.reducer;
