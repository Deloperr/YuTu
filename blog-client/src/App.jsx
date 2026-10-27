import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import PostList from './components/PostList';
import './App.css';

const loadUser = () => {
  const saved = localStorage.getItem('user');
  return saved && localStorage.getItem('token') ? JSON.parse(saved) : null;
};

function App() {
  const [user, setUser] = useState(loadUser);

  // Сервер вернул 401 – токен удалён в api.js, сбрасываем пользователя
  useEffect(() => {
    const handler = () => setUser(null);
    window.addEventListener('auth-logout', handler);
    return () => window.removeEventListener('auth-logout', handler);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="logo" href="/">
            Yu<span>Tu</span>
          </a>
          <LoginForm user={user} onLogin={setUser} onLogout={logout} />
        </div>
      </header>

      <main className="app">
        <section className="hero">
          <p className="hero-kicker">Блоговая платформа</p>
          <h1>Заметки, статьи и обсуждения</h1>
          <p className="hero-text">
            Делитесь мыслями, читайте других авторов и оценивайте публикации.
          </p>
        </section>
        <PostList user={user} />
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span className="logo small">
            Yu<span>Tu</span>
          </span>
          <span>© 2026 · Блог с комментариями и рейтингами</span>
        </div>
      </footer>
    </>
  );
}

export default App;
