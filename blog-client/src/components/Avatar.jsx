function Avatar({ name = '', size = 40 }) {
  const clean = name.split('@')[0].trim() || '?';
  const initials = clean
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  let hash = 0;
  for (const ch of clean) hash = (hash * 31 + ch.charCodeAt(0)) % 360;

  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `hsl(${hash}, 45%, 88%)`,
        color: `hsl(${hash}, 45%, 30%)`,
      }}
    >
      {initials}
    </span>
  );
}

export default Avatar;
