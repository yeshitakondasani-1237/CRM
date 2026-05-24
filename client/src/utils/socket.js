import { io } from 'socket.io-client';

// Use production backend URL or fallback to the current origin (dev server proxy)
const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

const socket = io(API_URL, {
  autoConnect: false,
});

export const connectSocket = (userId) => {
  if (!socket.connected) {
    socket.connect();
    socket.emit('join_room', userId);
    console.log(`Socket connecting and joining room: ${userId}`);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log('Socket disconnected');
  }
};

export default socket;
