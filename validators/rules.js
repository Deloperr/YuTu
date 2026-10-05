// Универсальный валидатор полей формы.
// Каждое поле описывается схемой; validate() возвращает нормализованные
// значения (values) и сообщения об ошибках (errors) по именам полей.

// Управляющие символы (кроме \n и \t) недопустимы ни в одном поле.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
// Хотя бы одна буква или цифра — строка из «.....» или «---» не считается текстом.
const HAS_LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

// Длина в символах (а не в UTF-16 единицах) — так же считает PostgreSQL char_length.
const charLength = (str) => Array.from(str).length;

function normalizeText(raw, multiline) {
  let value = raw.replace(/\r\n?/g, '\n').trim();
  if (multiline) {
    value = value
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n'); // не больше одной пустой строки подряд
  } else {
    value = value.replace(/\s+/g, ' '); // однострочное поле: схлопываем пробелы
  }
  return value;
}

function validateText(raw, rule) {
  if (raw.length > rule.max * 4) return { error: `Не более ${rule.max} символов` };
  if (CONTROL_CHARS.test(raw)) return { error: 'Содержит недопустимые управляющие символы' };

  const value = normalizeText(raw, rule.multiline);
  if (value === '') {
    return {
      value,
      error: raw.length > 0
        ? 'Поле не может состоять только из пробелов'
        : 'Поле обязательно для заполнения',
    };
  }

  const len = charLength(value);
  if (len < rule.min) return { value, error: `Минимум ${rule.min} симв. (сейчас ${len})` };
  if (len > rule.max) return { value, error: `Максимум ${rule.max} симв. (сейчас ${len})` };
  if (!HAS_LETTER_OR_DIGIT.test(value)) return { value, error: 'Должно содержать буквы или цифры' };
  if (rule.pattern && !rule.pattern.test(value)) return { value, error: rule.patternMessage };
  return { value };
}

function validateInteger(raw, rule) {
  const str = raw.trim();
  if (str === '') {
    return { value: str, error: raw.length > 0 ? 'Поле не может состоять только из пробелов' : 'Поле обязательно для заполнения' };
  }
  if (/^-\s*\d/.test(str)) return { value: str, error: 'Значение не может быть отрицательным' };
  // Только цифры: отсекаем «1.5», «1e3», «+5», «0x10», «12abc».
  if (!/^\d{1,6}$/.test(str)) return { value: str, error: 'Введите целое неотрицательное число' };

  const num = Number(str);
  if (num < rule.min || num > rule.max) {
    return { value: str, error: `Допустимый диапазон: от ${rule.min} до ${rule.max}` };
  }
  return { value: num };
}

function validateChoice(raw, rule) {
  const value = raw.trim();
  if (value === '') return { value, error: 'Выберите значение из списка' };
  if (!rule.options.includes(value)) return { value: '', error: 'Недопустимое значение' };
  return { value };
}

const validators = { text: validateText, integer: validateInteger, choice: validateChoice };

/**
 * @param {object} schema  { fieldName: { type, label, ...ограничения } }
 * @param {object} body    req.body
 * @returns {{ values: object, errors: object, isValid: boolean }}
 */
function validate(schema, body = {}) {
  const values = {};
  const errors = {};

  for (const [field, rule] of Object.entries(schema)) {
    const raw = body[field];

    // Повтор поля в запросе (title=a&title=b) превращается в массив — это подделка формы.
    if (raw !== undefined && typeof raw !== 'string') {
      values[field] = '';
      errors[field] = 'Некорректный формат значения';
      continue;
    }

    const result = validators[rule.type](raw ?? '', rule);
    values[field] = result.value ?? '';
    if (result.error) errors[field] = result.error;
  }

  return { values, errors, isValid: Object.keys(errors).length === 0 };
}

module.exports = { validate, charLength };
