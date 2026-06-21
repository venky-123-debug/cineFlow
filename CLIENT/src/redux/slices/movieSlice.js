import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchMovies = createAsyncThunk(
  "movies/fetchMovies",
  async ({ page = 1, search = "", genre = "" }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page,
        limit: 12,
        ...(search && { search }),
        ...(genre && { genre }),
      });
      const response = await api.get(`/api/movies?${params}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch movies",
      );
    }
  },
);

export const fetchMovieById = createAsyncThunk(
  "movies/fetchMovieById",
  async (movieId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/movies/${movieId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch movie",
      );
    }
  },
);

export const createMovie = createAsyncThunk(
  "movies/createMovie",
  async (movieData, { rejectWithValue }) => {
    try {
      const response = await api.post("/api/movies", movieData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create movie",
      );
    }
  },
);

export const updateMovie = createAsyncThunk(
  "movies/updateMovie",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/movies/${id}`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update movie",
      );
    }
  },
);

export const uploadBanner = createAsyncThunk(
  "movies/uploadBanner",
  async ({ movieId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("banner", file);
      const response = await api.post(
        `/api/movies/${movieId}/upload-banner`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to upload banner",
      );
    }
  },
);

const initialState = {
  movies: [],
  currentMovie: null,
  loading: false,
  error: null,
  pagination: {},
  searchParams: { page: 1, search: "", genre: "" },
};

const movieSlice = createSlice({
  name: "movies",
  initialState,
  reducers: {
    setSearchParams: (state, action) => {
      state.searchParams = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMovies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMovies.fulfilled, (state, action) => {
        state.loading = false;
        state.movies = action.payload.movies;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMovies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMovieById.fulfilled, (state, action) => {
        state.currentMovie = action.payload;
      })
      .addCase(createMovie.fulfilled, (state, action) => {
        state.movies.unshift(action.payload);
      })
      .addCase(updateMovie.fulfilled, (state, action) => {
        const index = state.movies.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) state.movies[index] = action.payload;
      })
      .addCase(uploadBanner.fulfilled, (state, action) => {
        if (state.currentMovie)
          state.currentMovie.banner = action.payload.movie.banner;
      });
  },
});

export const { setSearchParams, clearError } = movieSlice.actions;
export default movieSlice.reducer;
