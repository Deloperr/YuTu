import { useState } from 'react';
import { socket } from '../socket';
import useSocketEvent from './useSocketEvent';

function useOnline() {
  const [connected, setConnected] = useState(socket.connected);
  const [online, setOnline] = useState({ count: 0, users: [] });

  useSocketEvent('connect', () => setConnected(true));
  useSocketEvent('disconnect', () => setConnected(false));
  useSocketEvent('online', setOnline);

  return { connected, ...online };
}

export default useOnline;
