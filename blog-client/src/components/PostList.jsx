import { useState, useEffect } from 'react';
import { fetchPosts, addPost, updatePost, deletePost, axios } from '../api';
import useDebounce from '../hooks/useDebounce';

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
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
          <p>Ошибка загрузки: {error}</p>
          <button
            className="btn-primary"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            Повторить
          </button>
        </div>
      );
    }
    if (posts.length === 0) {
      return <div className="empty">Постов не найдено</div>;
    }
    return (
      <>
        <ul className="post-list">
          {posts.map((post) => (
            <li
              key={post.id}
              className={`post-card ${post.pending ? 'pending' : ''}`}
            >
              <h3>
                {post.title}
                {post.pending && <span className="badge">Сохранение...</span>}
              </h3>
              <p>{post.content}</p>
              <div className="post-meta">
                Автор: {post.author} | Рейтинг:{' '}
                {Number(post.rating || 0).toFixed(1)} | Комментариев:{' '}
                {post.comments ? post.comments.length : 0}
              </div>
              {user && (
                <div className="post-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => startEdit(post)}
                    disabled={post.pending}
                  >
                    Редактировать
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => handleDelete(post.id)}
                    disabled={post.pending}
                  >
                    Удалить
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {page < pages && (
          <button
            className="btn-secondary load-more"
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
        <div className="form">
          <input
            placeholder="Заголовок"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <input
            placeholder="Содержимое"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <input
            placeholder="Автор (по умолчанию email)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="btn-primary" onClick={handleSubmit}>
            {editingId ? 'Сохранить' : 'Добавить'}
          </button>
          {editingId && (
            <button className="btn-secondary" onClick={resetForm}>
              Отмена
            </button>
          )}
        </div>
      ) : (
        <p className="hint">Войдите, чтобы добавлять и редактировать посты</p>
      )}

      <div className="controls">
        <input
          placeholder="Поиск по заголовку, тексту или автору..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="date">По дате</option>
          <option value="rating">По рейтингу</option>
        </select>
      </div>

      <p className="stats">
        Найдено постов: {total} | Показано: {posts.length}
        {search !== debouncedSearch && ' | Ожидание ввода...'}
        {pendingCount > 0 && ` | Отправка на сервер: ${pendingCount}`}
      </p>

      {renderList()}

      {notice && <div className={`toast ${notice.type}`}>{notice.text}</div>}
    </>
  );
}

export default PostList;
