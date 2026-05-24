import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import notificationReducer from './notificationSlice.js';

const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationReducer,
  },
});

export default store;
