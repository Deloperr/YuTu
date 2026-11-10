import { useState, useCallback } from 'react';
import useSocketEvent from '../hooks/useSocketEvent';

let nextId = 1;

function LiveToasts() {
  const [items, setItems] = useState([]);

  const push = useCallback((type, text) => {
    const id = nextId++;
    setItems((prev) => [...prev.slice(-3), { id, type, text }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  useSocketEvent('presence', ({ type, name }) =>
    push(type, type === 'join' ? `${name} подключился` : `${name} отключился`)
  );
  useSocketEvent('post:created', (post) =>
    push('post', `Новая запись «${post.title}» от ${post.author}`)
  );
  useSocketEvent('post:deleted', ({ title }) =>
    push('leave', `Запись «${title}» удалена`)
  );

  return (
    <div className="live-toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`live-toast ${t.type}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}

export default LiveToasts;
