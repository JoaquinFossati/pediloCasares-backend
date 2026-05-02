const { Notificacion } = require('../models');

// GET /notificaciones — lista las últimas 50 del usuario
const listar = async (req, res) => {
  try {
    const notifs = await Notificacion.findAll({
      where:  { usuarioId: req.user.id },
      order:  [['createdAt', 'DESC']],
      limit:  50,
    });
    res.json(notifs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

// GET /notificaciones/no-leidas — devuelve el contador de no leídas
const contarNoLeidas = async (req, res) => {
  try {
    const count = await Notificacion.count({
      where: { usuarioId: req.user.id, leido: false },
    });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al contar notificaciones' });
  }
};

// PATCH /notificaciones/:id/leer — marca una como leída
const marcarLeida = async (req, res) => {
  try {
    await Notificacion.update(
      { leido: true },
      { where: { id: req.params.id, usuarioId: req.user.id } }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al marcar notificación' });
  }
};

// PATCH /notificaciones/leer-todo — marca todas como leídas
const marcarTodasLeidas = async (req, res) => {
  try {
    await Notificacion.update(
      { leido: true },
      { where: { usuarioId: req.user.id, leido: false } }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al marcar notificaciones' });
  }
};

module.exports = { listar, contarNoLeidas, marcarLeida, marcarTodasLeidas };
