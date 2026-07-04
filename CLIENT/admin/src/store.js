import { configureStore } from '@reduxjs/toolkit';

const initialAuth = {
  isAuthenticated: !!localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,
};

const authReducer = (state = initialAuth, action) => {
  switch (action.type) {
    case 'auth/login':
      return { ...state, ...action.payload, loading: false, error: null };
    case 'auth/logout':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { ...state, isAuthenticated: false, user: null, token: null, loading: false, error: null };
    case 'auth/error':
      return { ...state, loading: false, error: action.payload };
    case 'auth/loading':
      return { ...state, loading: true, error: null };
    default:
      return state;
  }
};

export default configureStore({
  reducer: {
    auth: authReducer,
  },
});
