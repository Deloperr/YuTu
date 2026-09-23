import { useState, useEffect } from 'react';

function PostList() {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      const saved = localStorage.getItem('posts');
      if (saved) {
        setPosts(JSON.parse(saved));
      } else {
        setPosts([
          { id: 1, title: 'Первый пост', content: 'Содержимое 1', author: 'Иван', rating: 4.5 },
          { id: 2, title: 'Второй пост', content: 'Содержимое 2', author: 'Мария', rating: 3.8 }
        ]);
      }
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('posts', JSON.stringify(posts));
    }
  }, [posts, loading]);

  useEffect(() => {
    document.title = `Постов: ${posts.length}`;
  }, [posts.length]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setAuthor('');
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!title.trim() || !content.trim() || !author.trim()) return;

    if (editingId) {
      setPosts(posts.map((p) =>
        p.id === editingId
          ? { ...p, title: title.trim(), content: content.trim(), author: author.trim() }
          : p
      ));
    } else {
      const newPost = {
        id: Date.now(),
        title: title.trim(),
        content: content.trim(),
        author: author.trim(),
        rating: 0
      };
      setPosts([newPost, ...posts]);
    }
    resetForm();
  };

  const startEdit = (post) => {
    setEditingId(post.id);
    setTitle(post.title);
    setContent(post.content);
    setAuthor(post.author);
  };

  const deletePost = (id) => {
    setPosts(posts.filter((p) => p.id !== id));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(filter.toLowerCase()) ||
    p.author.toLowerCase().includes(filter.toLowerCase())
  );

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    return b.id - a.id;
  });

  const avgRating = posts.length
    ? (posts.reduce((sum, p) => sum + p.rating, 0) / posts.length).toFixed(2)
    : 0;

  if (loading) return <div className="loading">Загрузка...</div>;

  return (
    <>
      <h1>Блог — управление постами</h1>

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
          placeholder="Автор"
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

      <div className="controls">
        <input
          placeholder="Поиск по названию или автору..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="date">По дате</option>
          <option value="rating">По рейтингу</option>
        </select>
      </div>

      <p className="stats">
        Всего постов: {posts.length} | Средний рейтинг: {avgRating}
      </p>

      {sortedPosts.length === 0 ? (
        <div className="empty">Постов не найдено</div>
      ) : (
        <ul className="post-list">
          {sortedPosts.map((post) => (
            <li key={post.id} className="post-card">
              <h3>{post.title}</h3>
              <p>{post.content}</p>
              <div className="post-meta">
                Автор: {post.author} | Рейтинг: {post.rating}
              </div>
              <div className="post-actions">
                <button className="btn-secondary" onClick={() => startEdit(post)}>
                  Редактировать
                </button>
                <button className="btn-danger" onClick={() => deletePost(post.id)}>
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default PostList;