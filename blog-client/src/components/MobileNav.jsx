import Icon from './Icon';

function MobileNav({ view, unread, onNavigate }) {
  const items = [
    { id: 'home', icon: 'home', label: 'Главная' },
    { id: 'top', icon: 'trend', label: 'Популярное' },
    { id: 'search', icon: 'search', label: 'Поиск' },
    { id: 'chat', icon: 'chat', label: 'Чат', badge: unread },
  ];

  return (
    <nav className="tabbar">
      {items.map((item) => (
        <button
          key={item.id}
          className={view === item.id ? 'active' : ''}
          onClick={() => onNavigate(item.id)}
        >
          <span className="nav-icon">
            <Icon name={item.icon} size={24} />
            {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export default MobileNav;
