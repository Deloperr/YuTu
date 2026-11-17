const getInitialTheme = () => {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

document.documentElement.dataset.theme = getInitialTheme();

function ThemeToggle({ withLabel = false }) {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.classList.add('theme-transition');
    root.dataset.theme = next;
    localStorage.setItem('theme', next);
    setTimeout(() => root.classList.remove('theme-transition'), 400);
  };

  return (
    <button
      className={withLabel ? 'nav-item theme-nav' : 'theme-toggle'}
      onClick={toggle}
      aria-label="Сменить тему"
      title="Сменить тему"
    >
      <span className="theme-icons">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-sun">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="icon-moon">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        </svg>
      </span>
      {withLabel && (
        <span className="nav-label">
          <span className="label-dark">Тёмная тема</span>
          <span className="label-light">Светлая тема</span>
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;
