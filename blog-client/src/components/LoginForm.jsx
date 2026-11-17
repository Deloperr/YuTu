import { useState } from 'react';
import { login, register } from '../api';
import Avatar from './Avatar';
import Icon from './Icon';

function LoginForm({ user, onLogin, onLogout, variant = 'bar' }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('user@yutu.local');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const handleLogin = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { data } = await login(email, password);
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      onLogin(data.data.user);
      setPassword('');
      setOpen(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await register(email, password);
      setMessage({ type: 'success', text: 'Регистрация успешна, войдите' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  if (user) {
    return (
      <div className={`account account--${variant}`}>
        <Avatar name={user.email} size={variant === 'sidebar' ? 40 : 34} />
        <div className="account-info">
          <span className="account-email">{user.email}</span>
          <span className="account-role">
            {user.role === 'admin' ? 'администратор' : 'автор'}
          </span>
        </div>
        <button
          className="icon-btn account-logout"
          onClick={onLogout}
          title="Выйти"
          aria-label="Выйти"
        >
          <Icon name="logout" size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className={`auth auth--${variant}`}>
      <button
        className="btn btn-primary auth-open"
        onClick={() => setOpen(!open)}
        title="Войти"
      >
        <Icon name="login" size={20} />
        <span>Войти</span>
      </button>
      {open && (
        <div className="auth-popover">
          <h3>Вход в блог</h3>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Пароль
            <input
              type="password"
              value={password}
              autoFocus
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </label>
          {message && (
            <p className={`auth-message ${message.type}`}>{message.text}</p>
          )}
          <div className="auth-buttons">
            <button
              className="btn btn-primary"
              onClick={handleLogin}
              disabled={busy}
            >
              {busy ? 'Вход...' : 'Войти'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={handleRegister}
              disabled={busy}
            >
              Регистрация
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginForm;
