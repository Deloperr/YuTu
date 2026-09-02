const express = require('express');
const app = express();

const port = 3000;

let posts = [];
let nextPostId = 1;

let comments = [];
let nextCommentId = 1;

const validatePost = (data) => {
    const errors = [];
    
    if (!data.title || data.title.trim() === '') {
        errors.push('Заголовок обязателен');
    }
    
    if (!data.content || data.content.trim() === '') {
        errors.push('Содержимое обязательно');
    }
    
    if (!data.author || data.author.trim() === '') {
        errors.push('Автор обязателен');
    }
    
    return errors;
};

const validateComment = (data) => {
    const errors = [];
    
    if (!data.text || data.text.trim() === '') {
        errors.push('Текст комментария обязателен');
    }
    
    if (!data.author || data.author.trim() === '') {
        errors.push('Автор комментария обязателен');
    }
    
    return errors;
};

app.get('/posts', (req, res) => {
    res.json({
        success: true,
        data: posts,
        count: posts.length
    });
});

app.get('/posts/:id', (req, res) => {
    const id = parseInt(req.params.id);

    const post = posts.find(p => p.id === id);

    if (!post) {
        return res.status(404).json({
            success: false,
            error: `Пост с ID ${id} не найден`
        });
    }

    const postComments = comments.filter(c => c.postId === id);

    res.json({
        success: true,
        data: {
            ...post,
            comments: postComments
        }
    });
});

app.post('/posts', (req, res) => {
    const validationErrors = validatePost(req.body);
    
    if (validationErrors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: validationErrors
        });
    }

    const newPost = {
        id: nextPostId++,
        title: req.body.title.trim(),
        content: req.body.content.trim(),
        author: req.body.author.trim(),
        rating: 0,
        ratingCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    posts.push(newPost);

    res.status(201).json({
        success: true,
        data: newPost,
        message: 'Пост успешно создан'
    });
});

// PUT /posts/:id
app.put('/posts/:id', (req, res) => {
    const id = parseInt(req.params.id);

    const postIndex = posts.findIndex(p => p.id === id);

    if (postIndex === -1) {
        return res.status(404).json({
            success: false,
            error: `Пост с ID ${id} не найден`
        });
    }

    const validationErrors = validatePost(req.body);
    
    if (validationErrors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: validationErrors
        });
    }

    const updatedPost = {
        ...posts[postIndex],
        title: req.body.title.trim(),
        content: req.body.content.trim(),
        author: req.body.author.trim(),
        updatedAt: new Date().toISOString()
    };

    posts[postIndex] = updatedPost;
    
    res.json({
        success: true,
        data: updatedPost,
        message: 'Пост успешно обновлён'
    });
});

// DELETE /posts/:id 
app.delete('/posts/:id', (req, res) => {
    const id = parseInt(req.params.id);

    const postIndex = posts.findIndex(p => p.id === id);
    
    if (postIndex === -1) {
        return res.status(404).json({
            success: false,
            error: `Пост с ID ${id} не найден`
        });
    }

    posts.splice(postIndex, 1);

    comments = comments.filter(c => c.postId !== id);
    
    res.json({
        success: true,
        message: `Пост с ID ${id} успешно удалён`
    });
});

app.post('/posts/:id/comments', (req, res) => {
    const postId = parseInt(req.params.id);

    const post = posts.find(p => p.id === postId);
    
    if (!post) {
        return res.status(404).json({
            success: false,
            error: `Пост с ID ${postId} не найден`
        });
    }

    const validationErrors = validateComment(req.body);
    
    if (validationErrors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: validationErrors
        });
    }

    const newComment = {
        id: nextCommentId++,
        postId: postId,
        text: req.body.text.trim(),
        author: req.body.author.trim(),
        rating: 0,
        createdAt: new Date().toISOString()
    };
    
    comments.push(newComment);
    
    res.status(201).json({
        success: true,
        data: newComment,
        message: 'Комментарий успешно добавлен'
    });
});

app.get('/posts/:id/comments', (req, res) => {
    const postId = parseInt(req.params.id);

    const post = posts.find(p => p.id === postId);
    
    if (!post) {
        return res.status(404).json({
            success: false,
            error: `Пост с ID ${postId} не найден`
        });
    }

    const postComments = comments.filter(c => c.postId === postId);
    
    res.json({
        success: true,
        data: postComments,
        count: postComments.length
    });
});

app.post('/posts/:id/rate', (req, res) => {
    const id = parseInt(req.params.id);
    const post = posts.find(p => p.id === id);
    
    if (!post) {
        return res.status(404).json({
            success: false,
            error: `Пост с ID ${id} не найден`
        });
    }
    
    const { rating } = req.body;

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({
            success: false,
            error: 'Рейтинг должен быть числом от 1 до 5'
        });
    }
    
    const totalRating = (post.rating * post.ratingCount) + rating;
    post.ratingCount += 1;
    post.rating = totalRating / post.ratingCount;
    
    res.json({
        success: true,
        data: {
            averageRating: Math.round(post.rating * 100) / 100,
            ratingCount: post.ratingCount
        },
        message: 'Оценка добавлена'
    });
});

app.get('/posts/stats', (req, res) => {
    if (posts.length === 0) {
        return res.json({
            success: true,
            data: {
                totalPosts: 0,
                totalComments: 0,
                averageRating: 0,
                popularPosts: []
            }
        });
    }

    const totalRating = posts.reduce((sum, p) => sum + p.rating, 0);
    const avgRating = totalRating / posts.length;

    const sortedPosts = [...posts].sort((a, b) => b.rating - a.rating);
    const popularPosts = sortedPosts.slice(0, 3).map(p => ({
        id: p.id,
        title: p.title,
        author: p.author,
        rating: Math.round(p.rating * 100) / 100
    }));
    
    res.json({
        success: true,
        data: {
            totalPosts: posts.length,
            totalComments: comments.length,
            averageRating: Math.round(avgRating * 100) / 100,
            popularPosts: popularPosts
        }
    });
});

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use((err, req, res, next) => {
    console.error('Ошибка:', err.stack);
    const statusCode = err.status || 500;

    const response = {
        success: false,
        error: err.message || 'Внутренняя ошибка сервера'
    };

    if (err.errors) {
        response.errors = err.errors;
    }

    if (process.env.NODE_ENV !== 'production') {
        response.stack = err.stack;
    }
    
    res.status(statusCode).json(response);
});

app.use((req, res, next) => {
    const err = new Error(`Маршрут ${req.originalUrl} не найден`);
    err.status = 404;
    next(err);
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
    console.log(`Адрес: http://localhost:${port}`);
});