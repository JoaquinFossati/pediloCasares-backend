const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');
const { registrarTracking } = require('./tracking');
const { registrarChat } = require('./chat');

const iniciarSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST'],
    },
  });

  // Middleware de autenticación para sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Token requerido'));

      const decoded = verifyToken(token);
      const user = await User.findByPk(decoded.id);
      if (!user || !user.estado) return next(new Error('Usuario inválido'));

      socket.userId = user.id;
      socket.userRol = user.rol;
      socket.userName = user.nombre;
      next();
    } catch {
      next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket conectado: ${socket.userName} [${socket.userRol}] (${socket.id})`);

    // Unirse a sala personal para notificaciones directas
    socket.join(`user:${socket.userId}`);

    registrarTracking(io, socket);
    registrarChat(io, socket);

    socket.on('disconnect', () => {
      console.log(`Socket desconectado: ${socket.userName} (${socket.id})`);
    });

    socket.on('error', (err) => {
      console.error(`Error socket [${socket.userName}]:`, err.message);
    });
  });

  return io;
};

module.exports = { iniciarSocket };
