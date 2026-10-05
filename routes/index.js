// Маршруты приложения.
const express = require('express');
const posts = require('../controllers/postController');
const auth = require('../controllers/authController');
const errors = require('../controllers/errorController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', posts.list);
router.get('/item/:id', posts.show);
router.post('/item/:id/comments', posts.addComment);

// Добавление поста доступно только «авторизованному» пользователю:
// requireAuth выполняется перед контроллером (цепочка middleware для маршрута).
router.get('/add', requireAuth, posts.showAddForm);
router.post('/add', requireAuth, posts.create);

router.get('/login', auth.login);
router.get('/logout', auth.logout);

router.get('/error/500', errors.syncError);
router.get('/error/500-db', errors.dbError);

module.exports = router;
