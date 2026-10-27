import { useState, useEffect } from 'react';
import { fetchPosts, addPost, updatePost, deletePost, axios } from '../api';
import useDebounce from '../hooks/useDebounce';
import Avatar from './Avatar';

const PAGE_SIZE = 5;

function PostList({ user }) {
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

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [notice, setNotice] = useState(null);

  // Запрос на сервер уходит только после паузы ввода 500 мс
  const debouncedSearch = useDebounce(search, 500);

  // Загрузка первой страницы при монтировании и смене поиска/сортировки
  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await fetchPosts(
          { search: debouncedSearch, sort: sortBy, page: 1, limit: PAGE_SIZE },
          controller.signal
        );
        setPosts(data.data);
        setTotal(data.total);
        setPage(1);
        setPages(data.pages);
      } catch (err) {
        // Запрос отменён при размонтировании или новом поиске
        if (axios.isCancel(err)) return;
        setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    // Отмена незавершённого запроса
    return () => controller.abort();
  }, [debouncedSearch, sortBy, reloadKey]);

  // Уведомление скрывается через 4 секунды
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
        page: page + 1,
        limit: PAGE_SIZE,
      });
      // Исключаем дубли, если список сместился после добавления
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

  // Оптимистичное добавление: временный пост сразу появляется в списке
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
      // Замена временного ID на реальный из ответа сервера
      setPosts((prev) =>
        prev.map((p) => (p.id === tempId ? { ...data.data, comments: [] } : p))
      );
      setNotice({ type: 'success', text: 'Пост создан' });
    } catch (err) {
      // Откат: удаляем временный пост
      setPosts((prev) => prev.filter((p) => p.id !== tempId));
      setTotal((t) => t - 1);
      setNotice({ type: 'error', text: `Пост не добавлен: ${err.message}` });
    }
  };

  // Оптимистичное редактирование с откатом к прежней версии
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

  // Оптимистичное удаление: при ошибке пост возвращается на место
  const handleDelete = async (id) => {
    const index = posts.findIndex((p) => p.id === id);
    const removed = posts[index];
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setTotal((t) => t - 1);
    if (editingId === id) resetForm();

    try {
      await deletePost(id);
      setNotice({ type: 'success', text: 'Пост удалён' });
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
  };

  const startEdit = (post) => {
    setEditingId(post.id);
    setTitle(post.title);
    setContent(post.content);
    setAuthor(post.author);
  };

  // Enter в однострочных полях, Ctrl/Cmd+Enter в тексте записи
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
          Загрузка постов...
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
          <h3>Постов не найдено</h3>
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
              className={`post-card ${post.pending ? 'pending' : ''}`}
            >
              <header className="post-head">
                <Avatar name={post.author} />
                <div>
                  <div className="post-author">{post.author}</div>
                  <time className="post-date">
                    {formatDate(post.createdAt)}
                  </time>
                </div>
                {post.pending && <span className="badge">Сохранение...</span>}
              </header>
              <h2 className="post-title">{post.title}</h2>
              <p className="post-content">{post.content}</p>
              <footer className="post-footer">
                <div className="post-stats">
                  <Stars value={post.rating} />
                  <span className="comments">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
                    </svg>
                    {post.comments ? post.comments.length : 0}
                  </span>
                </div>
                {user && (
                  <div className="post-actions">
                    <button
                      className="btn btn-text"
                      onClick={() => startEdit(post)}
                      disabled={post.pending}
                    >
                      Редактировать
                    </button>
                    <button
                      className="btn btn-text danger"
                      onClick={() => handleDelete(post.id)}
                      disabled={post.pending}
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </footer>
            </article>
          ))}
        </div>
        {page < pages && (
          <button
            className="btn btn-ghost load-more"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Загрузка...' : 'Загрузить ещё'}
          </button>
        )}
      </>
    );
  };

  return (
    <>
      {user ? (
        <section className={`composer ${editingId ? 'editing' : ''}`}>
          <div className="composer-head">
            <Avatar name={user.email} size={36} />
            <span>{editingId ? 'Редактирование записи' : 'Новая запись'}</span>
          </div>
          <input
            className="composer-title"
            placeholder="Заголовок"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <textarea
            className="composer-content"
            placeholder="О чём хотите рассказать?"
            rows={3}
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
                <button className="btn btn-ghost" onClick={resetForm}>
                  Отмена
                </button>
              )}
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingId ? 'Сохранить' : 'Опубликовать'}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <p className="hint">Войдите, чтобы публиковать и редактировать записи.</p>
      )}

      <div className="toolbar">
        <div className="search">
          <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            placeholder="Поиск по заголовку, тексту или автору"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="tabs">
          <button
            className={sortBy === 'date' ? 'active' : ''}
            onClick={() => setSortBy('date')}
          >
            Новые
          </button>
          <button
            className={sortBy === 'rating' ? 'active' : ''}
            onClick={() => setSortBy('rating')}
          >
            Лучшие
          </button>
        </div>
      </div>

      <p className="stats">
        Найдено постов: {total} · Показано: {posts.length}
        {search !== debouncedSearch && ' · Ожидание ввода...'}
        {pendingCount > 0 && ` · Отправка на сервер: ${pendingCount}`}
      </p>

      {renderList()}

      {notice && <div className={`toast ${notice.type}`}>{notice.text}</div>}
    </>
  );
}

// Рейтинг звёздами: заполнено округлённое значение из пяти
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

const formatDate = (value) =>
  new Date(value || Date.now()).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export default PostList;
