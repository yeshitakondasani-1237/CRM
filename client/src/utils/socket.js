import { io } from 'socket.io-client';

// Since the dev server is proxied, we can point to window.location.origin or path
const socket = io(window.location.origin, {
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
