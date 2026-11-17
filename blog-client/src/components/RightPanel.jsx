import Icon from './Icon';
import Avatar from './Avatar';
import useOnline from '../hooks/useOnline';

const plural = (n, one, few, many) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

function RightPanel({ user, search, onSearch, tag, onTag, stats }) {
  const { connected, count, users } = useOnline();
  const guests = Math.max(count - users.length, 0);

  return (
    <aside className="rightbar">
      <div className="rightbar-inner">
        <label className="search">
          <Icon name="search" size={18} />
          <input
            placeholder="Поиск по блогу"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </label>

        {!user && (
          <section className="widget widget-join">
            <h2>Впервые в YuTu?</h2>
            <p>
              Войдите, чтобы публиковать записи, оценивать их, комментировать и
              общаться в чате.
            </p>
          </section>
        )}

        <section className="widget">
          <h2>Блог в цифрах</h2>
          <div className="stat-grid">
            <div>
              <strong>{stats?.totalPosts ?? '–'}</strong>
              <span>записей</span>
            </div>
            <div>
              <strong>{stats?.totalComments ?? '–'}</strong>
              <span>комментариев</span>
            </div>
            <div>
              <strong>
                {stats?.averageRating != null ? stats.averageRating.toFixed(1) : '–'}
              </strong>
              <span>средний рейтинг</span>
            </div>
          </div>
        </section>

        <section className="widget">
          <h2>Популярные теги</h2>
          <ul className="tag-list">
            {(stats?.popularTags || []).map((t) => (
              <li key={t.tag}>
                <button
                  className={tag === t.tag ? 'active' : ''}
                  onClick={() => onTag(tag === t.tag ? null : t.tag)}
                >
                  <span className="tag-name">#{t.tag}</span>
                  <span className="tag-count">
                    {t.posts} {plural(t.posts, 'запись', 'записи', 'записей')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="widget">
          <h2>
            Сейчас в сети
            <span className={`live-dot ${connected ? 'on' : 'off'}`} />
          </h2>
          {connected ? (
            <>
              <ul className="online-list">
                {users.map((name) => (
                  <li key={name}>
                    <Avatar name={name} size={32} />
                    <span>{name}</span>
                  </li>
                ))}
              </ul>
              {guests > 0 && (
                <p className="widget-note">
                  и {guests} {plural(guests, 'гость', 'гостя', 'гостей')}
                </p>
              )}
            </>
          ) : (
            <p className="widget-note">Нет соединения, переподключение...</p>
          )}
        </section>

        <footer className="rightbar-footer">
          © 2026 YuTu · Блог с комментариями и рейтингами
        </footer>
      </div>
    </aside>
  );
}

export default RightPanel;
