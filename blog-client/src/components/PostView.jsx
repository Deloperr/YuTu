import { useState, useEffect } from 'react';
import { fetchPost, ratePost, axios } from '../api';
import useSocketEvent from '../hooks/useSocketEvent';
import Avatar from './Avatar';
import Icon from './Icon';
import PostDiscussion from './PostDiscussion';

const plural = (n, one, few, many) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

const formatFull = (value) =>
  new Date(value).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

function PostView({ postId, user, onBack, onTag }) {
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);
  const [deleted, setDeleted] = useState(false);
  const [hover, setHover] = useState(0);
  const [rateMessage, setRateMessage] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const { data } = await fetchPost(postId, controller.signal);
        setPost(data.data);
      } catch (err) {
        if (!axios.isCancel(err)) setError(err.message);
      }
    };
    load();
    return () => controller.abort();
  }, [postId]);

  useSocketEvent('post:updated', (data) => {
    if (data.id === postId) setPost((prev) => prev && { ...prev, ...data });
  });

  useSocketEvent('post:deleted', ({ id }) => {
    if (id === postId) setDeleted(true);
  });

  useSocketEvent('post:comments', ({ postId: id, count }) => {
    if (id === postId) setPost((prev) => prev && { ...prev, commentCount: count });
  });

  const myRating = post?.ratings?.find((r) => r.userId === user?.id)?.value || 0;

  const rate = async (value) => {
    try {
      const { data } = await ratePost(postId, value);
      setPost((prev) => {
        const others = (prev.ratings || []).filter((r) => r.userId !== user.id);
        return {
          ...prev,
          rating: data.data.averageRating,
          ratings: [...others, { userId: user.id, value }],
        };
      });
      setRateMessage('Оценка учтена');
    } catch (err) {
      setRateMessage(err.message);
    }
  };

  if (error) {
    return (
      <div className="error-box">
        <h3>Не удалось открыть запись</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={onBack}>
          Вернуться к ленте
        </button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="loading">
        <div className="spinner" />
        Загрузка записи...
      </div>
    );
  }

  const profile = post.authorId?.profile;
  const comments = post.commentCount ?? post.comments?.length ?? 0;
  const votes = post.ratings?.length ?? 0;
  const shown = hover || myRating;

  return (
    <article className="post-view">
      {deleted && (
        <p className="pv-deleted">Эта запись была удалена другим пользователем.</p>
      )}

      <header className="pv-author">
        <Avatar name={post.author} size={52} />
        <div>
          <strong>{post.author}</strong>
          <span>
            {profile?.displayName === post.author && profile?.city
              ? `автор блога · ${profile.city}`
              : 'автор блога'}
          </span>
        </div>
      </header>

      <h1 className="pv-title">{post.title}</h1>
      <p className="pv-content">{post.content}</p>

      {post.tags?.length > 0 && (
        <div className="post-tags">
          {post.tags.map((t) => (
            <button key={t} onClick={() => onTag(t)}>
              #{t}
            </button>
          ))}
        </div>
      )}

      <p className="pv-date">
        {formatFull(post.createdAt)}
        <span>
          <Icon name="eye" size={16} />
          {post.views ?? 0} {plural(post.views ?? 0, 'просмотр', 'просмотра', 'просмотров')}
        </span>
      </p>

      <div className="pv-stats">
        <span>
          <strong>{comments}</strong> {plural(comments, 'комментарий', 'комментария', 'комментариев')}
        </span>
        <span>
          <strong>{Number(post.rating || 0).toFixed(1)}</strong> средний рейтинг
        </span>
        <span>
          <strong>{votes}</strong> {plural(votes, 'оценка', 'оценки', 'оценок')}
        </span>
      </div>

      <div className="pv-rate">
        {user ? (
          <>
            <span>{myRating ? 'Ваша оценка' : 'Оцените запись'}</span>
            <div className="rate-stars" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={n <= shown ? 'on' : ''}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => rate(n)}
                  disabled={deleted}
                  aria-label={`Оценка ${n}`}
                >
                  <Icon name="star" size={26} />
                </button>
              ))}
            </div>
            {rateMessage && <span className="pv-rate-msg">{rateMessage}</span>}
          </>
        ) : (
          <span>Войдите, чтобы оценить запись</span>
        )}
      </div>

      {!deleted && <PostDiscussion postId={post.id} user={user} />}
    </article>
  );
}

export default PostView;
