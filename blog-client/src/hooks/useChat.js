import { useState, useEffect, useRef } from 'react';
import { socket, emitWithAck } from '../socket';
import useSocketEvent from './useSocketEvent';

const TYPING_IDLE_MS = 2000;
const TYPING_EXPIRE_MS = 4000;

const displayName = (user) =>
  user.profile?.displayName || user.email.split('@')[0];

function useChat(user, visible) {
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState([]);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(socket.connected);

  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) setUnread(0);
  }

  const typingTimers = useRef({});
  const typingSent = useRef(false);
  const idleTimer = useRef(null);

  const addMessage = (message) =>
    setMessages((prev) => [...prev, message].slice(-200));

  const removeTyping = (name) => {
    clearTimeout(typingTimers.current[name]);
    setTyping((prev) => prev.filter((n) => n !== name));
  };

  useSocketEvent('connect', () => setConnected(true));
  useSocketEvent('disconnect', () => setConnected(false));
  useSocketEvent('chat:history', setMessages);

  useSocketEvent('chat:message', (message) => {
    addMessage(message);
    removeTyping(message.author);
    if (!visible) setUnread((n) => n + 1);
  });

  useSocketEvent('presence', ({ type, name, at }) => {
    addMessage({
      id: `sys-${type}-${name}-${at}`,
      system: true,
      text: type === 'join' ? `${name} подключился к чату` : `${name} покинул чат`,
    });
  });

  useSocketEvent('chat:typing', ({ name, typing: isTyping }) => {
    if (!isTyping) return removeTyping(name);
    clearTimeout(typingTimers.current[name]);
    typingTimers.current[name] = setTimeout(() => removeTyping(name), TYPING_EXPIRE_MS);
    setTyping((prev) => (prev.includes(name) ? prev : [...prev, name]));
  });

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 3500);
    return () => clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    const timers = typingTimers.current;
    return () => {
      clearTimeout(idleTimer.current);
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const stopTyping = () => {
    clearTimeout(idleTimer.current);
    if (typingSent.current) {
      socket.emit('chat:typing', false);
      typingSent.current = false;
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    if (!typingSent.current) {
      socket.emit('chat:typing', true);
      typingSent.current = true;
    }
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  };

  const send = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;

    const tempId = `tmp-${Date.now()}`;
    addMessage({
      id: tempId,
      userId: user.id,
      author: displayName(user),
      text: value,
      createdAt: new Date().toISOString(),
      pending: true,
    });
    setText('');
    stopTyping();

    const res = await emitWithAck('chat:message', { text: value });
    setMessages((prev) =>
      prev.map((m) =>
        m.id !== tempId ? m : res.ok ? res.message : { ...m, pending: false, failed: true }
      )
    );
    if (!res.ok) setError(res.error);
  };

  const typingText =
    typing.length === 0
      ? ''
      : typing.length === 1
        ? `${typing[0]} печатает...`
        : `${typing.join(', ')} печатают...`;

  return {
    messages,
    unread,
    text,
    typingText,
    error,
    connected,
    handleChange,
    stopTyping,
    send,
  };
}

export default useChat;
