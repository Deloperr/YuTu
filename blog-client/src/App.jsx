import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import MobileNav from './components/MobileNav';
import PostList from './components/PostList';
import PostView from './components/PostView';
import LoginForm from './components/LoginForm';
import ThemeToggle from './components/ThemeToggle';
import LiveChat from './components/LiveChat';
import LiveToasts from './components/LiveToasts';
import Icon from './components/Icon';
import useStats from './hooks/useStats';
import { socket } from './socket';
import './App.css';

const postFromHash = () => {
  const match = window.location.hash.match(/^#\/post\/([0-9a-f]{24})$/);
  return match ? match[1] : null;
};

const loadUser = () => {
  const saved = localStorage.getItem('user');
  return saved && localStorage.getItem('token') ? JSON.parse(saved) : null;
};

function App() {
  const [user, setUser] = useState(loadUser);
  const [sortBy, setSortBy] = useState('date');
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeKey, setComposeKey] = useState(0);
  const { stats, reload } = useStats();
  const [postId, setPostId] = useState(postFromHash);
  const feedScroll = useRef(0);

  useEffect(() => {
    const onPop = () => setPostId(postFromHash());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (postId) {
      window.scrollTo(0, 0);
    } else {
      requestAnimationFrame(() => window.scrollTo(0, feedScroll.current));
    }
  }, [postId]);

  const openPost = (id) => {
    feedScroll.current = window.scrollY;
    window.history.pushState({ post: id }, '', `#/post/${id}`);
    setPostId(id);
  };

  const closePost = () => {
    if (window.history.state?.post) {
      window.history.back();
    } else {
      window.history.replaceState(null, '', window.location.pathname);
      setPostId(null);
    }
  };

  const leavePost = () => {
    if (!postId) return;
    feedScroll.current = 0;
    window.history.replaceState(null, '', window.location.pathname);
    setPostId(null);
  };

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

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const navigate = (id) => {
    if (id === 'chat') {
      setChatOpen((o) => !o);
      return;
    }
    setChatOpen(false);
    leavePost();
    if (id === 'home') {
      setSortBy('date');
      setTag(null);
    } else if (id === 'top') {
      setSortBy('rating');
    } else if (id === 'search') {
      document.querySelector('.main-tools .search input')?.focus();
    }
    scrollTop();
  };

  const compose = () => {
    setComposeOpen(true);
    setComposeKey((k) => k + 1);
  };

  const chooseTag = (value) => {
    leavePost();
    setTag(value);
    scrollTop();
  };

  const view = chatOpen ? 'chat' : sortBy === 'rating' ? 'top' : 'home';
  const title = tag ? `#${tag}` : sortBy === 'rating' ? 'Популярное' : 'Главная';

  return (
    <div className="layout">
      <Sidebar
        user={user}
        view={view}
        unread={unread}
        onNavigate={navigate}
        onCompose={compose}
        onLogin={setUser}
        onLogout={logout}
      />

      <main className="main">
        <header className="main-header">
          <div className="mobile-bar">
            <button className="logo" onClick={() => navigate('home')}>
              Yu<span>Tu</span>
            </button>
            <div className="mobile-bar-right">
              <ThemeToggle />
              <LoginForm user={user} onLogin={setUser} onLogout={logout} />
            </div>
          </div>

          {postId ? (
            <div className="main-title main-title--post">
              <button className="icon-btn" onClick={closePost} aria-label="Назад">
                <Icon name="back" size={22} />
              </button>
              <h1>Запись</h1>
            </div>
          ) : (
            <>
              <div className="main-title">
                <h1>{title}</h1>
                {tag && (
                  <button className="chip chip-reset" onClick={() => setTag(null)}>
                    Все записи
                    <Icon name="close" size={14} />
                  </button>
                )}
              </div>

              <div className="feed-tabs" role="tablist">
                <button
                  role="tab"
                  className={sortBy === 'date' ? 'active' : ''}
                  onClick={() => setSortBy('date')}
                >
                  <span>Новые</span>
                </button>
                <button
                  role="tab"
                  className={sortBy === 'rating' ? 'active' : ''}
                  onClick={() => setSortBy('rating')}
                >
                  <span>Лучшие</span>
                </button>
              </div>
            </>
          )}
        </header>

        {postId && (
          <PostView
            key={postId}
            postId={postId}
            user={user}
            onBack={closePost}
            onTag={chooseTag}
          />
        )}

        <div className="feed-area" hidden={!!postId}>
          <div className="main-tools">
            <label className="search">
              <Icon name="search" size={18} />
              <input
                placeholder="Поиск по блогу"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            {stats?.popularTags?.length > 0 && (
              <div className="tag-chips">
                {stats.popularTags.map((t) => (
                  <button
                    key={t.tag}
                    className={`chip ${tag === t.tag ? 'active' : ''}`}
                    onClick={() => chooseTag(tag === t.tag ? null : t.tag)}
                  >
                    #{t.tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          <PostList
            user={user}
            search={search}
            sortBy={sortBy}
            tag={tag}
            onTag={chooseTag}
            composeKey={composeKey}
            composeOpen={composeOpen}
            onComposeOpen={setComposeOpen}
            onChanged={reload}
            onOpen={openPost}
          />
        </div>
      </main>

      <RightPanel
        user={user}
        search={search}
        onSearch={setSearch}
        tag={tag}
        onTag={chooseTag}
        stats={stats}
      />

      {user && !postId && (
        <button className="fab" onClick={compose} aria-label="Новая запись">
          <Icon name="plus" size={26} />
        </button>
      )}

      <MobileNav view={view} unread={unread} onNavigate={navigate} />
      <LiveChat user={user} open={chatOpen} onOpenChange={setChatOpen} onUnread={setUnread} />
      <LiveToasts />
    </div>
  );
}

export default App;
