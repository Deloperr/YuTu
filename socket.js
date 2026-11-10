const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const Message = require('./models/Message');

const HISTORY_LIMIT = 50;
const MAX_TEXT = 500;

let io = null;

const roomOf = (postId) => `post:${postId}`;

const createLimiter = (max, windowMs) => {
  let stamps = [];
  return () => {
    const now = Date.now();
    stamps = stamps.filter((t) => now - t < windowMs);
    if (stamps.length >= max) return false;
    stamps.push(now);
    return true;
  };
};

const readText = (payload) => String((payload && payload.text) || '').trim();

const checkText = (text) => {
  if (!text) return 'Пустое сообщение';
  if (text.length > MAX_TEXT) return `Не длиннее ${MAX_TEXT} символов`;
  return null;
};

const viewersOf = (postId) => io.sockets.adapter.rooms.get(roomOf(postId))?.size || 0;

const emitViewers = (postId, count = viewersOf(postId)) => {
  io.to(roomOf(postId)).emit('post:viewers', { postId, count });
};

const emitOnline = async () => {
  const sockets = await io.fetchSockets();
  const users = [
    ...new Set(sockets.filter((s) => s.data.user).map((s) => s.data.user.name))
  ];
  io.emit('online', { count: sockets.length, users });
};

const authenticate = async (socket, next) => {
  const { token } = socket.handshake.auth || {};
  socket.data.user = null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');
    const user = await User.findById(payload.id).select('email role profile');
    if (!user) return next(new Error('Пользователь не найден'));
    socket.data.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.profile?.displayName || user.email.split('@')[0]
    };
    next();
  } catch {
    next(new Error('Неверный или просроченный токен'));
  }
};

const registerHandlers = (socket) => {
  const { user } = socket.data;
  const name = user ? user.name : 'Гость';
  const allow = createLimiter(5, 5000);

  const guard = (ack) => {
    if (!user) {
      ack({ ok: false, error: 'Войдите, чтобы писать сообщения' });
      return false;
    }
    if (!allow()) {
      ack({ ok: false, error: 'Слишком часто, подождите пару секунд' });
      return false;
    }
    return true;
  };

  socket.on('chat:message', async (payload, ack = () => {}) => {
    if (!guard(ack)) return;
    const text = readText(payload);
    const error = checkText(text);
    if (error) return ack({ ok: false, error });
    try {
      const message = await Message.create({ author: name, userId: user.id, text });
      socket.broadcast.emit('chat:message', message);
      socket.broadcast.emit('chat:typing', { name, typing: false });
      ack({ ok: true, message });
    } catch (err) {
      ack({ ok: false, error: err.message });
    }
  });

  socket.on('chat:typing', (typing) => {
    if (!user) return;
    socket.broadcast.emit('chat:typing', { name, typing: Boolean(typing) });
  });

  socket.on('post:join', async (postId, ack = () => {}) => {
    if (!mongoose.isValidObjectId(postId)) {
      return ack({ ok: false, error: 'Некорректный id' });
    }
    const post = await Post.findById(postId).select('comments');
    if (!post) return ack({ ok: false, error: 'Пост не найден' });
    socket.join(roomOf(postId));
    ack({ ok: true, comments: post.comments });
    emitViewers(postId);
  });

  socket.on('post:leave', (postId) => {
    socket.leave(roomOf(postId));
    emitViewers(postId);
  });

  socket.on('comment:add', async (payload, ack = () => {}) => {
    if (!guard(ack)) return;
    const postId = payload && payload.postId;
    const text = readText(payload);
    const error = checkText(text) || (!mongoose.isValidObjectId(postId) && 'Некорректный id');
    if (error) return ack({ ok: false, error });
    try {
      const post = await Post.findByIdAndUpdate(
        postId,
        { $push: { comments: { author: name, text } } },
        { new: true, runValidators: true, projection: 'comments' }
      );
      if (!post) return ack({ ok: false, error: 'Пост не найден' });
      const comment = post.comments[post.comments.length - 1];
      socket.to(roomOf(postId)).emit('comment:new', { postId, comment });
      io.emit('post:comments', { postId, count: post.comments.length });
      ack({ ok: true, comment });
    } catch (err) {
      ack({ ok: false, error: err.message });
    }
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room.startsWith('post:')) {
        const postId = room.slice(5);
        emitViewers(postId, viewersOf(postId) - 1);
      }
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket отключён: ${socket.id} (${name}), причина: ${reason}`);
    socket.broadcast.emit('presence', { type: 'leave', name, at: new Date() });
    emitOnline();
  });
};

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' }
  });

  io.use(authenticate);

  io.on('connection', async (socket) => {
    const name = socket.data.user ? socket.data.user.name : 'Гость';
    console.log(`Socket подключён: ${socket.id} (${name})`);
    registerHandlers(socket);

    socket.broadcast.emit('presence', { type: 'join', name, at: new Date() });
    emitOnline();

    const history = await Message.find().sort({ createdAt: -1 }).limit(HISTORY_LIMIT);
    socket.emit('chat:history', history.reverse());
  });

  return io;
};

const broadcast = (req, event, payload, postId) => {
  if (!io) return;
  let target = postId ? io.to(roomOf(postId)) : io;
  const socketId = req.get('x-socket-id');
  if (socketId) target = target.except(socketId);
  target.emit(event, payload);
};

module.exports = { initSocket, broadcast };
