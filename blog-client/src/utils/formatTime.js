const formatTime = (value) => {
  const date = new Date(value);
  const time = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === new Date().toDateString()) return time;
  return `${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}, ${time}`;
};

export default formatTime;
