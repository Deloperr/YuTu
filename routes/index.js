// Маршруты приложения.
const express = require('express');
const posts = require('../controllers/postController');
const auth = require('../controllers/authController');
const demo = require('../controllers/demoController');
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

router.get('/demo/500', demo.syncError);
router.get('/demo/500-async', demo.asyncError);

module.exports = router;
