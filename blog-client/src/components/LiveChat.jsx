import Icon from './Icon';
import ChatView from './ChatView';

function LiveChat({ chat, user, open, onOpenChange, onExpand }) {
  return (
    <section className={`chat-dock ${open ? 'open' : ''}`}>
      <div className="chat-dock-head">
        <button
          className="chat-dock-toggle"
          onClick={() => onOpenChange(!open)}
          aria-expanded={open}
        >
          <Icon name="chat" size={20} />
          <strong>Общий чат</strong>
          <span
            className={`live-dot ${chat.connected ? 'on' : 'off'}`}
            title={chat.connected ? 'в сети' : 'переподключение...'}
          />
          {chat.unread > 0 && !open && <span className="chat-count">{chat.unread}</span>}
        </button>
        <button
          className="icon-btn"
          onClick={onExpand}
          title="Открыть большой чат"
          aria-label="Открыть большой чат"
        >
          <Icon name="expand" size={18} />
        </button>
        <button
          className="icon-btn chat-chevron"
          onClick={() => onOpenChange(!open)}
          aria-label={open ? 'Свернуть' : 'Развернуть'}
        >
          <Icon name="chevron" size={20} />
        </button>
      </div>

      {open && <ChatView chat={chat} user={user} variant="dock" />}
    </section>
  );
}

export default LiveChat;
