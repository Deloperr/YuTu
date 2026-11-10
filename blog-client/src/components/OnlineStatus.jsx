import { useState } from 'react';
import { socket } from '../socket';
import useSocketEvent from '../hooks/useSocketEvent';

function OnlineStatus() {
  const [connected, setConnected] = useState(socket.connected);
  const [online, setOnline] = useState({ count: 0, users: [] });

  useSocketEvent('connect', () => setConnected(true));
  useSocketEvent('disconnect', () => setConnected(false));
  useSocketEvent('online', setOnline);

  const title = connected
    ? `Авторизованы: ${online.users.join(', ') || 'никого'}`
    : 'Соединение с сервером потеряно, переподключение...';

  return (
    <span className={`online ${connected ? 'on' : 'off'}`} title={title}>
      <span className="online-dot" />
      <span className="online-text">
        {connected ? `Онлайн: ${online.count}` : 'Офлайн'}
      </span>
    </span>
  );
}

export default OnlineStatus;
