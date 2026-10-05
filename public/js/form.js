// Счётчик символов
document.querySelectorAll('[data-counter][maxlength]').forEach((field) => {
  const hint = field.parentElement.querySelector('.hint');
  if (!hint) return;

  const counter = document.createElement('span');
  counter.className = 'counter';
  hint.appendChild(counter);

  const max = Number(field.getAttribute('maxlength'));
  const update = () => {
    const len = Array.from(field.value.trim()).length;
    counter.textContent = `${len} / ${max}`;
    counter.classList.toggle('is-limit', len >= max);
  };
  field.addEventListener('input', update);
  update();
});
