import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchTheatres = createAsyncThunk(
  "theatres/fetchTheatres",
  async ({ city = "" } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (city) params.append("city", city);
      const res = await api.get(`/api/theatres?${params}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch theatres");
    }
  }
);

export const fetchCities = createAsyncThunk(
  "theatres/fetchCities",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/api/theatres/cities");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch cities");
    }
  }
);

export const createTheatre = createAsyncThunk(
  "theatres/createTheatre",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/api/theatres", data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create theatre");
    }
  }
);

export const updateTheatre = createAsyncThunk(
  "theatres/updateTheatre",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/api/theatres/${id}`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update theatre");
    }
  }
);

export const deleteTheatre = createAsyncThunk(
  "theatres/deleteTheatre",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/theatres/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete theatre");
    }
  }
);

const theatreSlice = createSlice({
  name: "theatres",
  initialState: {
    theatres: [],
    cities: [],
    selectedCity: "",
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedCity: (state, action) => { state.selectedCity = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTheatres.pending,   (s) => { s.loading = true; })
      .addCase(fetchTheatres.fulfilled, (s, a) => { s.loading = false; s.theatres = a.payload; })
      .addCase(fetchTheatres.rejected,  (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchCities.fulfilled,   (s, a) => { s.cities = a.payload; })
      .addCase(createTheatre.fulfilled, (s, a) => { s.theatres.unshift(a.payload); })
      .addCase(updateTheatre.fulfilled, (s, a) => {
        const i = s.theatres.findIndex(t => t.id === a.payload.id);
        if (i !== -1) s.theatres[i] = a.payload;
      })
      .addCase(deleteTheatre.fulfilled, (s, a) => {
        s.theatres = s.theatres.filter(t => t.id !== a.payload);
      });
  },
});

export const { setSelectedCity } = theatreSlice.actions;
export default theatreSlice.reducer;
