import Icon from './Icon';
import LoginForm from './LoginForm';
import ThemeToggle from './ThemeToggle';

function Sidebar({ user, view, unread, onNavigate, onCompose, onLogin, onLogout }) {
  const items = [
    { id: 'home', icon: 'home', label: 'Главная' },
    { id: 'top', icon: 'trend', label: 'Популярное' },
    { id: 'chat', icon: 'chat', label: 'Общий чат', badge: unread },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <button className="logo" onClick={() => onNavigate('home')} title="YuTu">
          <span className="logo-full">
            Yu<span>Tu</span>
          </span>
          <span className="logo-mark">Y</span>
        </button>

        <nav className="side-nav">
          {items.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              title={item.label}
            >
              <span className="nav-icon">
                <Icon name={item.icon} size={24} />
                {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
              </span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
          <ThemeToggle withLabel />
        </nav>

        {user && (
          <button className="btn btn-primary compose-btn" onClick={onCompose} title="Написать">
            <Icon name="pen" size={20} />
            <span>Написать</span>
          </button>
        )}

        <div className="sidebar-account">
          <LoginForm user={user} onLogin={onLogin} onLogout={onLogout} variant="sidebar" />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
