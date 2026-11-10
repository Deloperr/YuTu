import { useState, useEffect } from 'react';
import { socket, emitWithAck } from '../socket';
import useSocketEvent from '../hooks/useSocketEvent';
import Avatar from './Avatar';
import formatTime from '../utils/formatTime';

function PostDiscussion({ postId, user }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewers, setViewers] = useState(1);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;

    const join = async () => {
      const res = await emitWithAck('post:join', postId);
      if (!active) return;
      if (res.ok) {
        setComments(res.comments);
        setError(null);
      } else {
        setError(res.error);
      }
      setLoading(false);
    };

    join();
    socket.on('connect', join);
    return () => {
      active = false;
      socket.off('connect', join);
      socket.emit('post:leave', postId);
    };
  }, [postId]);

  useSocketEvent('comment:new', (data) => {
    if (data.postId !== postId) return;
    setComments((prev) =>
      prev.some((c) => c.id === data.comment.id)
        ? prev
        : [...prev, { ...data.comment, fresh: true }]
    );
  });

  useSocketEvent('post:viewers', (data) => {
    if (data.postId === postId) setViewers(data.count);
  });

  const send = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setSending(true);
    const res = await emitWithAck('comment:add', { postId, text: value });
    setSending(false);
    if (res.ok) {
      setComments((prev) => [...prev, res.comment]);
      setText('');
      setError(null);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="discussion">
      <div className="discussion-head">
        <span>Обсуждение</span>
        <span className="viewers">
          <span className="online-dot" />
          Сейчас читают: {viewers}
        </span>
      </div>

      {loading ? (
        <p className="discussion-note">Загрузка комментариев...</p>
      ) : comments.length === 0 ? (
        <p className="discussion-note">Комментариев пока нет, будьте первым</p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className={`comment ${c.fresh ? 'fresh' : ''}`}>
              <Avatar name={c.author} size={28} />
              <div>
                <div className="comment-meta">
                  <strong>{c.author}</strong>
                  <time>{formatTime(c.createdAt)}</time>
                </div>
                <p>{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="discussion-error">{error}</p>}

      {user ? (
        <form className="comment-form" onSubmit={send}>
          <input
            placeholder="Написать комментарий..."
            value={text}
            maxLength={500}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn btn-primary" disabled={sending || !text.trim()}>
            {sending ? '...' : 'Отправить'}
          </button>
        </form>
      ) : (
        <p className="discussion-note">Войдите, чтобы комментировать</p>
      )}
    </div>
  );
}

export default PostDiscussion;
