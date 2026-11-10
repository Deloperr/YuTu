import { useEffect, useRef } from 'react';
import { socket } from '../socket';

function useSocketEvent(event, handler) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    const listener = (...args) => handlerRef.current(...args);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [event]);
}

export default useSocketEvent;
