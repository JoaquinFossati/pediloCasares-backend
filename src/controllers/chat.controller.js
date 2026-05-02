const { Mensaje, Pedido, User } = require('../models');

const historial = async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const { limit = 50, offset = 0, canal = 'cliente_comercio' } = req.query;

    const pedido = await Pedido.findByPk(pedidoId);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    const autorizado =
      pedido.clienteId === req.user.id ||
      pedido.deliveryId === req.user.id ||
      req.user.rol === 'admin' ||
      req.user.rol === 'comerciante';

    if (!autorizado) return res.status(403).json({ error: 'Sin permiso' });

    const { Op } = require('sequelize');
    const mensajes = await Mensaje.findAndCountAll({
      where: { pedidoId, canal },
      include: [{ model: User, as: 'remitente', attributes: ['id', 'nombre', 'foto', 'rol'] }],
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    await Mensaje.update(
      { leido: true },
      { where: { pedidoId, canal, remitenteId: { [Op.ne]: req.user.id }, leido: false } }
    );

    res.json(mensajes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

const noLeidos = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const count = await Mensaje.count({
      include: [{
        model: Pedido, as: 'pedido',
        where: {
          [Op.or]: [
            { clienteId: req.user.id },
            { deliveryId: req.user.id },
          ],
        },
        required: true,
      }],
      where: { remitenteId: { [Op.ne]: req.user.id }, leido: false },
    });
    res.json({ noLeidos: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al contar mensajes no leídos' });
  }
};

module.exports = { historial, noLeidos };
