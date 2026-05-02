const { Op } = require('sequelize');
const { User, Comercio, Pedido, Direccion } = require('../models');

const obtenerPerfil = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Direccion, as: 'direcciones', order: [['principal', 'DESC']] }],
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

const actualizarPerfil = async (req, res) => {
  try {
    const { nombre, telefono, foto } = req.body;
    const user = req.user;
    if (nombre !== undefined) user.nombre = nombre;
    if (telefono !== undefined) user.telefono = telefono;
    if (foto !== undefined) user.foto = foto;
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    const user = await User.findByPk(req.user.id);

    const ok = await user.comparePassword(passwordActual);
    if (!ok) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    await user.update({ password: passwordNueva });
    res.json({ message: 'Contraseña actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
};

const toggleEnLinea = async (req, res) => {
  try {
    const { enLinea } = req.body;
    await req.user.update({ enLinea });
    res.json({ enLinea: req.user.enLinea });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};

const guardarFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    await req.user.update({ fcmToken });
    res.json({ message: 'Token guardado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar token' });
  }
};

const deliveriesDisponibles = async (req, res) => {
  try {
    const count = await User.count({
      where: { rol: 'delivery', enLinea: true, estado: true },
    });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar deliveries' });
  }
};

const obtenerEstadisticas = async (req, res) => {
  try {
    const userId = req.params.id || req.user.id;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    let stats = {};

    if (user.rol === 'cliente') {
      const [total, completados, cancelados] = await Promise.all([
        Pedido.count({ where: { clienteId: userId } }),
        Pedido.count({ where: { clienteId: userId, estado: 'entregado' } }),
        Pedido.count({ where: { clienteId: userId, estado: 'cancelado' } }),
      ]);
      stats = { pedidosTotal: total, pedidosCompletados: completados, pedidosCancelados: cancelados };
    }

    if (user.rol === 'delivery') {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const [total, hoyCount] = await Promise.all([
        Pedido.count({ where: { deliveryId: userId, estado: 'entregado' } }),
        Pedido.count({ where: { deliveryId: userId, estado: 'entregado', horaEntregaReal: { [Op.gte]: hoy } } }),
      ]);
      stats = { entregasTotal: total, entregasHoy: hoyCount, rating: user.rating, enLinea: user.enLinea };
    }

    res.json({ ...user.toJSON(), stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// ── ADMIN ──────────────────────────────────────────────────────────────

const listarUsuarios = async (req, res) => {
  try {
    const { rol, estado, search, limit = 20, offset = 0 } = req.query;
    const where = {};
    if (rol) where.rol = rol;
    if (estado !== undefined) where.estado = estado === 'true';
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { nombre: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const usuarios = await User.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

const obtenerUsuario = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Direccion, as: 'direcciones' }],
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { nombre, telefono, foto, rol } = req.body;
    if (nombre !== undefined) user.nombre = nombre;
    if (telefono !== undefined) user.telefono = telefono;
    if (foto !== undefined) user.foto = foto;
    if (rol !== undefined) user.rol = rol;
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

const toggleEstadoUsuario = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (user.rol === 'admin') return res.status(403).json({ error: 'No se puede desactivar un admin' });

    await user.update({ estado: !user.estado });
    res.json({ id: user.id, estado: user.estado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cambiar estado del usuario' });
  }
};

const crearAdmin = async (req, res) => {
  try {
    const { email, password, nombre, telefono } = req.body;
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email ya registrado' });

    const admin = await User.create({ email, password, nombre, telefono, rol: 'admin' });
    res.status(201).json(admin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear admin' });
  }
};

module.exports = {
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
  toggleEnLinea,
  guardarFcmToken,
  deliveriesDisponibles,
  obtenerEstadisticas,
  listarUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  toggleEstadoUsuario,
  crearAdmin,
};
