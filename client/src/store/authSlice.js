import { createSlice } from '@reduxjs/toolkit';

const token = localStorage.getItem('token');
let user = null;
try {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    user = JSON.parse(storedUser);
  }
} catch (e) {
  console.error('Failed to parse stored user:', e);
}

const initialState = {
  user,
  token,
  isAuthenticated: !!token,
  loading: false,
  error: null,
  themeMode: localStorage.getItem('themeMode') || 'dark', // Modern default to dark
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action) {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      if (action.payload.user?.preferences?.theme) {
        state.themeMode = action.payload.user.preferences.theme;
        localStorage.setItem('themeMode', action.payload.user.preferences.theme);
      }
    },
    loginFail(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    updateProfile(state, action) {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    toggleTheme(state) {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', state.themeMode);
    },
    setTheme(state, action) {
      state.themeMode = action.payload;
      localStorage.setItem('themeMode', action.payload);
    }
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFail,
  logout,
  updateProfile,
  toggleTheme,
  setTheme,
} = authSlice.actions;

export default authSlice.reducer;
