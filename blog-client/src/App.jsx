import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import PostList from './components/PostList';
import ThemeToggle from './components/ThemeToggle';
import OnlineStatus from './components/OnlineStatus';
import LiveChat from './components/LiveChat';
import LiveToasts from './components/LiveToasts';
import { socket } from './socket';
import './App.css';

const loadUser = () => {
  const saved = localStorage.getItem('user');
  return saved && localStorage.getItem('token') ? JSON.parse(saved) : null;
};

function App() {
  const [user, setUser] = useState(loadUser);

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

  useEffect(() => {
    socket.connect();
    return () => socket.disconnect();
  }, [user?.id]);

  useEffect(() => {
    const handleError = (err) => {
      if (!localStorage.getItem('token') || socket.active) return;
      console.warn('Socket.IO:', err.message);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    };
    socket.on('connect_error', handleError);
    return () => socket.off('connect_error', handleError);
  }, []);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="logo" href="/">
            Yu<span>Tu</span>
          </a>
          <div className="topbar-right">
            <OnlineStatus />
            <ThemeToggle />
            <LoginForm user={user} onLogin={setUser} onLogout={logout} />
          </div>
        </div>
      </header>

      <main className="app">
        <section className="hero">
          <p className="hero-kicker">Блоговая платформа</p>
          <h1>Заметки, статьи и обсуждения</h1>
          <p className="hero-text">
            Делитесь мыслями, обсуждайте записи в реальном времени и общайтесь
            в общем чате.
          </p>
        </section>
        <PostList user={user} />
      </main>

      <LiveChat user={user} />
      <LiveToasts />

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
