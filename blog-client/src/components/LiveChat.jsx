import { useState, useEffect, useRef } from 'react';
import { socket, emitWithAck } from '../socket';
import useSocketEvent from '../hooks/useSocketEvent';
import Avatar from './Avatar';
import formatTime from '../utils/formatTime';

const TYPING_IDLE_MS = 2000;
const TYPING_EXPIRE_MS = 4000;

const displayName = (user) =>
  user.profile?.displayName || user.email.split('@')[0];

function LiveChat({ user }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(0);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState([]);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(socket.connected);

  const listRef = useRef(null);
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
    if (!open) setUnread((n) => n + 1);
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
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, typing, open]);

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

  const toggle = () => {
    setUnread(0);
    setOpen(!open);
  };

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

  return (
    <>
      <button
        className={`chat-fab ${open ? 'active' : ''}`}
        onClick={toggle}
        aria-label="Общий чат"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
          )}
        </svg>
        {unread > 0 && !open && <span className="chat-badge">{unread}</span>}
      </button>

      {open && (
        <section className="chat-panel">
          <header className="chat-head">
            <div>
              <strong>Общий чат</strong>
              <span className={`chat-state ${connected ? 'on' : 'off'}`}>
                {connected ? 'в сети' : 'переподключение...'}
              </span>
            </div>
          </header>

          <div className="chat-list" ref={listRef}>
            {messages.length === 0 && (
              <p className="chat-empty">Сообщений пока нет</p>
            )}
            {messages.map((m) => {
              if (m.system) {
                return (
                  <div key={m.id} className="chat-system">
                    {m.text}
                  </div>
                );
              }
              const mine = user && m.userId === user.id;
              return (
                <div
                  key={m.id}
                  className={`chat-msg ${mine ? 'mine' : ''} ${m.pending ? 'pending' : ''} ${m.failed ? 'failed' : ''}`}
                >
                  {!mine && <Avatar name={m.author} size={28} />}
                  <div className="chat-bubble">
                    {!mine && <span className="chat-author">{m.author}</span>}
                    <p>{m.text}</p>
                    <time>
                      {formatTime(m.createdAt)}
                      {m.pending && ' · отправка'}
                      {m.failed && ' · не доставлено'}
                    </time>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="chat-typing">{typingText}</div>
          {error && <div className="chat-error">{error}</div>}

          {user ? (
            <form className="chat-form" onSubmit={send}>
              <input
                placeholder="Сообщение..."
                value={text}
                maxLength={500}
                onChange={handleChange}
                onBlur={stopTyping}
              />
              <button
                className="btn btn-primary"
                disabled={!text.trim() || !connected}
              >
                Отправить
              </button>
            </form>
          ) : (
            <p className="chat-guest">Войдите, чтобы писать в чат</p>
          )}
        </section>
      )}
    </>
  );
}

export default LiveChat;
