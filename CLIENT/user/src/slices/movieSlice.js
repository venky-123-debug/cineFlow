import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchMovies = createAsyncThunk('movies/fetchMovies', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get('/api/movies', { params: { limit: 12, ...params } });
    return res.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch movies');
  }
});

const movieSlice = createSlice({
  name: 'movies',
  initialState: { movies: [], loading: false, error: null, pagination: {} },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchMovies.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMovies.fulfilled, (state, action) => {
      state.loading = false;
      state.movies = action.payload.movies || [];
      state.pagination = action.payload.pagination || {};
    });
    builder.addCase(fetchMovies.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export default movieSlice.reducer;
