const { Op } = require('sequelize');
const { Transaccion, Pedido, User } = require('../models');

const listar = async (req, res) => {
  try {
    const { estado, metodoPago, desde, hasta, limit = 20, offset = 0 } = req.query;
    const where = {};

    if (req.user.rol !== 'admin') where.usuarioId = req.user.id;
    if (estado) where.estado = estado;
    if (metodoPago) where.metodoPago = metodoPago;
    if (desde || hasta) {
      where.fechaTransaccion = {};
      if (desde) where.fechaTransaccion[Op.gte] = new Date(desde);
      if (hasta) where.fechaTransaccion[Op.lte] = new Date(hasta);
    }

    const transacciones = await Transaccion.findAndCountAll({
      where,
      include: [
        { model: Pedido, as: 'pedido', attributes: ['id', 'numeroPedido', 'estado'] },
        { model: User, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
      ],
      order: [['fechaTransaccion', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.json(transacciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
};

const obtener = async (req, res) => {
  try {
    const transaccion = await Transaccion.findByPk(req.params.id, {
      include: [
        { model: Pedido, as: 'pedido' },
        { model: User, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
      ],
    });
    if (!transaccion) return res.status(404).json({ error: 'Transacción no encontrada' });

    if (req.user.rol !== 'admin' && transaccion.usuarioId !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso' });
    }
    res.json(transaccion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener transacción' });
  }
};

const reembolsar = async (req, res) => {
  try {
    const transaccion = await Transaccion.findByPk(req.params.id);
    if (!transaccion) return res.status(404).json({ error: 'Transacción no encontrada' });
    if (transaccion.estado !== 'completada') {
      return res.status(400).json({ error: 'Solo se pueden reembolsar transacciones completadas' });
    }

    // TODO: llamar a API de Mercado Pago para reversa si metodoPago === 'tarjeta'
    await transaccion.update({ estado: 'reembolsada' });
    res.json({ message: 'Reembolso procesado', transaccion });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar reembolso' });
  }
};

// Webhook de Mercado Pago
const webhookMP = async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type === 'payment') {
      const referenciaMP = data?.id?.toString();
      const transaccion = await Transaccion.findOne({ where: { referenciaMP } });
      if (transaccion) {
        await transaccion.update({ estado: 'completada' });
        // TODO: actualizar estado del pedido asociado
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

module.exports = { listar, obtener, reembolsar, webhookMP };
