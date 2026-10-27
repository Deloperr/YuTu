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
    <div className="app">
      <header className="header">
        <h1>Блог — управление постами</h1>
        <LoginForm user={user} onLogin={setUser} onLogout={logout} />
      </header>
      <PostList user={user} />
    </div>
  );
}

export default App;
