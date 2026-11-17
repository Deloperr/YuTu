import { useState, useEffect, useRef } from 'react';
import { fetchPosts, addPost, updatePost, deletePost, axios } from '../api';
import useDebounce from '../hooks/useDebounce';
import useSocketEvent from '../hooks/useSocketEvent';
import Avatar from './Avatar';
import PostDiscussion from './PostDiscussion';
import Icon from './Icon';

const PAGE_SIZE = 5;

function PostList({
  user,
  search,
  sortBy,
  tag,
  onTag,
  composeKey,
  composeOpen,
  onComposeOpen,
  onChanged,
  onOpen,
}) {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [notice, setNotice] = useState(null);
  const [openId, setOpenId] = useState(null);

  const debouncedSearch = useDebounce(search, 500);
  const titleRef = useRef(null);
  const composerRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await fetchPosts(
          { search: debouncedSearch, sort: sortBy, tag, page: 1, limit: PAGE_SIZE },
          controller.signal
        );
        setPosts(data.data);
        setTotal(data.total);
        setPage(1);
        setPages(data.pages);
      } catch (err) {
        if (axios.isCancel(err)) return;
        setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [debouncedSearch, sortBy, tag, reloadKey]);

  useEffect(() => {
    if (!composeKey) return;
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    titleRef.current?.focus({ preventScroll: true });
  }, [composeKey]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    document.title = `Постов: ${total}`;
  }, [total]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const { data } = await fetchPosts({
        search: debouncedSearch,
        sort: sortBy,
        tag,
        page: page + 1,
        limit: PAGE_SIZE,
      });
      setPosts((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        return [...prev, ...data.data.filter((p) => !ids.has(p.id))];
      });
      setPage(data.page);
      setPages(data.pages);
      setTotal(data.total);
    } catch (err) {
      setNotice({ type: 'error', text: `Не удалось загрузить: ${err.message}` });
    } finally {
      setLoadingMore(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setAuthor('');
    setEditingId(null);
  };

  useSocketEvent('post:created', (post) => {
    if (debouncedSearch || tag || sortBy !== 'date') return;
    if (posts.some((p) => p.id === post.id)) return;
    setPosts((prev) => [{ ...post, fresh: true }, ...prev]);
    setTotal((t) => t + 1);
  });

  useSocketEvent('post:updated', (post) => {
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...post } : p)));
  });

  useSocketEvent('post:deleted', ({ id }) => {
    if (!posts.some((p) => p.id === id)) return;
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setTotal((t) => t - 1);
    if (editingId === id) resetForm();
    if (openId === id) setOpenId(null);
  });

  useSocketEvent('post:comments', ({ postId, count }) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentCount: count } : p))
    );
  });

  const handleAdd = async (fields) => {
    const tempId = Date.now();
    const tempPost = {
      id: tempId,
      ...fields,
      author: fields.author || user.email,
      rating: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setPosts((prev) => [tempPost, ...prev]);
    setTotal((t) => t + 1);

    try {
      const { data } = await addPost(fields);
      setPosts((prev) =>
        prev.map((p) => (p.id === tempId ? { ...data.data, comments: [] } : p))
      );
      setNotice({ type: 'success', text: 'Пост создан' });
      onChanged?.();
    } catch (err) {
      setPosts((prev) => prev.filter((p) => p.id !== tempId));
      setTotal((t) => t - 1);
      setNotice({ type: 'error', text: `Пост не добавлен: ${err.message}` });
    }
  };

  const handleUpdate = async (id, fields) => {
    const previous = posts.find((p) => p.id === id);
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...fields, pending: true } : p))
    );

    try {
      const { data } = await updatePost(id, fields);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...data.data, pending: false } : p
        )
      );
      setNotice({ type: 'success', text: 'Пост обновлён' });
    } catch (err) {
      setPosts((prev) => prev.map((p) => (p.id === id ? previous : p)));
      setNotice({ type: 'error', text: `Изменения отменены: ${err.message}` });
    }
  };

  const handleDelete = async (id) => {
    const index = posts.findIndex((p) => p.id === id);
    const removed = posts[index];
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setTotal((t) => t - 1);
    if (editingId === id) resetForm();

    try {
      await deletePost(id);
      setNotice({ type: 'success', text: 'Пост удалён' });
      onChanged?.();
    } catch (err) {
      setPosts((prev) => {
        const copy = [...prev];
        copy.splice(Math.min(index, copy.length), 0, removed);
        return copy;
      });
      setTotal((t) => t + 1);
      setNotice({ type: 'error', text: `Пост не удалён: ${err.message}` });
    }
  };

  const handleSubmit = () => {
    const fields = {
      title: title.trim(),
      content: content.trim(),
      author: author.trim(),
    };
    if (!fields.title || !fields.content) {
      setNotice({ type: 'error', text: 'Заполните заголовок и содержимое' });
      return;
    }
    if (editingId) {
      handleUpdate(editingId, fields);
    } else {
      handleAdd(fields);
    }
    resetForm();
    onComposeOpen(false);
  };

  const closeComposer = () => {
    resetForm();
    onComposeOpen(false);
  };

  const startEdit = (post) => {
    setEditingId(post.id);
    setTitle(post.title);
    setContent(post.content);
    setAuthor(post.author);
    onComposeOpen(true);
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    titleRef.current?.focus({ preventScroll: true });
  };

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    if (e.target.tagName === 'TEXTAREA' && !(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    handleSubmit();
  };

  const pendingCount = posts.filter((p) => p.pending).length;

  const renderList = () => {
    if (loading) {
      return (
        <div className="loading">
          <div className="spinner" />
          Загрузка записей...
        </div>
      );
    }
    if (error) {
      return (
        <div className="error-box">
          <h3>Не удалось загрузить ленту</h3>
          <p>{error}</p>
          <button
            className="btn btn-primary"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            Повторить
          </button>
        </div>
      );
    }
    if (posts.length === 0) {
      return (
        <div className="empty">
          <h3>Записей не найдено</h3>
          <p>Попробуйте изменить запрос или напишите первую запись.</p>
        </div>
      );
    }
    return (
      <>
        <div className="post-list">
          {posts.map((post) => (
            <article
              key={post.id}
              className={`post ${post.pending ? 'pending' : ''} ${post.fresh ? 'fresh' : ''} ${openId === post.id ? 'open' : ''}`}
            >
              <Avatar name={post.author} size={44} />
              <div
                className="post-body"
                onClick={(e) => {
                  if (post.pending || e.target.closest('button, input, textarea, .discussion')) return;
                  onOpen(post.id);
                }}
              >
                <header className="post-meta">
                  <span className="post-author">{post.author}</span>
                  <span className="post-date">· {formatDate(post.createdAt)}</span>
                  {post.pending && <span className="badge">Сохранение...</span>}
                </header>
                <h2 className="post-title">{post.title}</h2>
                <p className="post-content">{post.content}</p>
                {post.content?.length > 280 && (
                  <span className="post-more">Читать полностью</span>
                )}
                {post.tags?.length > 0 && (
                  <div className="post-tags">
                    {post.tags.map((t) => (
                      <button key={t} onClick={() => onTag(t)}>
                        #{t}
                      </button>
                    ))}
                  </div>
                )}
                <footer className="post-footer">
                  <button
                    className={`comments ${openId === post.id ? 'active' : ''}`}
                    onClick={() => setOpenId(openId === post.id ? null : post.id)}
                    disabled={post.pending}
                    title="Обсуждение в реальном времени"
                  >
                    <Icon name="chat" size={18} />
                    {post.commentCount ?? post.comments?.length ?? 0}
                  </button>
                  <Stars value={post.rating} />
                  <span className="post-views" title="Просмотры">
                    <Icon name="eye" size={17} />
                    {post.views ?? 0}
                  </span>
                  {user && (
                    <div className="post-actions">
                      <button
                        className="btn btn-text"
                        onClick={() => startEdit(post)}
                        disabled={post.pending}
                        title="Изменить"
                      >
                        <Icon name="pen" size={17} />
                        <span className="btn-label">Изменить</span>
                      </button>
                      <button
                        className="btn btn-text danger"
                        onClick={() => handleDelete(post.id)}
                        disabled={post.pending}
                        title="Удалить"
                      >
                        <Icon name="trash" size={17} />
                        <span className="btn-label">Удалить</span>
                      </button>
                    </div>
                  )}
                </footer>
                {openId === post.id && (
                  <PostDiscussion postId={post.id} user={user} />
                )}
              </div>
            </article>
          ))}
        </div>
        {page < pages && (
          <button
            className="btn btn-ghost load-more"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Загрузка...' : 'Показать ещё'}
          </button>
        )}
      </>
    );
  };

  return (
    <div className="feed">
      {user ? (
        <>
          <div
            className={`sheet-backdrop ${composeOpen ? 'open' : ''}`}
            onClick={closeComposer}
          />
          <section
            ref={composerRef}
            className={`composer ${editingId ? 'editing' : ''} ${composeOpen ? 'sheet-open' : ''}`}
          >
            <div className="composer-sheet-head">
              <button className="icon-btn" onClick={closeComposer} aria-label="Закрыть">
                <Icon name="close" size={20} />
              </button>
              <span>{editingId ? 'Редактирование' : 'Новая запись'}</span>
            </div>
            <Avatar name={user.email} size={44} />
            <div className="composer-body">
              {editingId && <div className="composer-mode">Редактирование записи</div>}
              <input
                ref={titleRef}
                className="composer-title"
                placeholder="Заголовок"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <textarea
                className="composer-content"
                placeholder="О чём хотите рассказать?"
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="composer-bottom">
                <input
                  className="composer-author"
                  placeholder="Автор (по умолчанию email)"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <div className="composer-buttons">
                  {editingId && (
                    <button className="btn btn-ghost" onClick={closeComposer}>
                      Отмена
                    </button>
                  )}
                  <button className="btn btn-primary" onClick={handleSubmit}>
                    {editingId ? 'Сохранить' : 'Опубликовать'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <p className="hint">Войдите, чтобы публиковать, редактировать и обсуждать записи.</p>
      )}

      <p className="stats">
        Найдено записей: {total} · Показано: {posts.length}
        {search !== debouncedSearch && ' · Ожидание ввода...'}
        {pendingCount > 0 && ` · Отправка на сервер: ${pendingCount}`}
      </p>

      {renderList()}

      {notice && <div className={`toast ${notice.type}`}>{notice.text}</div>}
    </div>
  );
}

function Stars({ value }) {
  const rating = Number(value || 0);
  const full = Math.round(rating);
  return (
    <span className="stars" title={`Рейтинг ${rating.toFixed(1)}`}>
      {'★'.repeat(full)}
      <span className="stars-empty">{'★'.repeat(5 - full)}</span>
      <span className="stars-value">{rating.toFixed(1)}</span>
    </span>
  );
}

const formatDate = (value) => {
  const date = new Date(value || Date.now());
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
};

export default PostList;
