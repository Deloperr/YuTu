import { useEffect, useRef } from 'react';
import Avatar from './Avatar';
import formatTime from '../utils/formatTime';

function ChatView({ chat, user, variant = 'dock' }) {
  const listRef = useRef(null);
  const page = variant === 'page';

  useEffect(() => {
    if (page) {
      window.scrollTo(0, document.documentElement.scrollHeight);
    } else if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [chat.messages, chat.typingText, page]);

  return (
    <div className={`chat-body chat-body--${variant}`}>
      <div className="chat-list" ref={listRef}>
        {chat.messages.length === 0 && (
          <p className="chat-empty">Сообщений пока нет</p>
        )}
        {chat.messages.map((m) => {
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
              {!mine && <Avatar name={m.author} size={page ? 36 : 28} />}
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

      <div className="chat-bottom">
        <div className="chat-typing">{chat.typingText}</div>
        {chat.error && <div className="chat-error">{chat.error}</div>}

        {user ? (
          <form className="chat-form" onSubmit={chat.send}>
            <input
              placeholder={page ? 'Написать сообщение...' : 'Сообщение...'}
              value={chat.text}
              maxLength={500}
              onChange={chat.handleChange}
              onBlur={chat.stopTyping}
            />
            <button
              className="btn btn-primary"
              disabled={!chat.text.trim() || !chat.connected}
            >
              Отправить
            </button>
          </form>
        ) : (
          <p className="chat-guest">Войдите, чтобы писать в чат</p>
        )}
      </div>
    </div>
  );
}

export default ChatView;
