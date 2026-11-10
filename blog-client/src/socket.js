import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || new URL(import.meta.env.VITE_API_URL).origin;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: (cb) => cb({ token: localStorage.getItem('token') }),
});

export const emitWithAck = (event, payload) =>
  socket
    .timeout(5000)
    .emitWithAck(event, payload)
    .catch(() => ({ ok: false, error: 'Сервер не ответил' }));
