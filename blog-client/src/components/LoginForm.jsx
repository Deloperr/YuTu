import { useState } from 'react';
import { login, register } from '../api';

function LoginForm({ user, onLogin, onLogout }) {
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
      <div className="auth auth-logged">
        <span>
          {user.email} <span className="role">{user.role}</span>
        </span>
        <button className="btn-secondary" onClick={onLogout}>
          Выйти
        </button>
      </div>
    );
  }

  return (
    <div className="auth">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
      />
      <button className="btn-primary" onClick={handleLogin} disabled={busy}>
        {busy ? 'Вход...' : 'Войти'}
      </button>
      <button className="btn-secondary" onClick={handleRegister} disabled={busy}>
        Регистрация
      </button>
      {message && <p className={`auth-message ${message.type}`}>{message.text}</p>}
    </div>
  );
}

export default LoginForm;
