const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.estado) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }
    req.user = user;

    // Actualizar ultimaActividad sin bloquear el request (fire-and-forget)
    // Solo si pasó más de 1 minuto desde la última actualización para reducir escrituras
    const ahora = new Date();
    const ultima = user.ultimaActividad;
    if (!ultima || (ahora - ultima) > 60_000) {
      User.update({ ultimaActividad: ahora }, { where: { id: user.id } }).catch(() => {});
    }

    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tenés permiso para esta acción' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
