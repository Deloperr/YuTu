import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Перехватчик запроса: добавляем JWT-токен в заголовок Authorization
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Перехватчик ответа: единый текст ошибки и сброс просроченного токена
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    if (!error.response) {
      error.message = 'Сервер недоступен. Проверьте подключение';
    } else {
      const { status, data } = error.response;
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-logout'));
      }
      error.message = data?.error || `Ошибка сервера (${status})`;
    }
    return Promise.reject(error);
  }
);

// Аутентификация
export const login = (email, password) =>
  api.post('/auth/login', { email, password });
export const register = (email, password) =>
  api.post('/auth/register', { email, password });

// Посты: params = { search, sort, page, limit }, signal – для отмены запроса
export const fetchPosts = (params, signal) =>
  api.get('/posts', { params, signal });
export const addPost = (post) => api.post('/posts', post);
export const updatePost = (id, updated) => api.put(`/posts/${id}`, updated);
export const deletePost = (id) => api.delete(`/posts/${id}`);

export { axios };
