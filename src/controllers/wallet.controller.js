const { User, MovimientoWallet, Pedido } = require('../models');
const { mover } = require('../services/wallet.service');
const sequelize = require('../config/database');

// GET /wallet/mi-billetera
const miBilletera = async (req, res) => {
  try {
    const usuario = await User.findByPk(req.user.id, {
      attributes: ['id', 'nombre', 'rol', 'saldo'],
    });

    const movimientos = await MovimientoWallet.findAll({
      where: { usuarioId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
      include: [{ model: Pedido, as: 'pedido', attributes: ['id', 'numeroPedido'], required: false }],
    });

    res.json({ saldo: parseFloat(usuario.saldo), movimientos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener billetera' });
  }
};

// GET /wallet/admin/resumen  (solo admin)
const resumenAdmin = async (req, res) => {
  try {
    const admin = await User.findByPk(req.user.id, { attributes: ['id', 'saldo'] });

    const [comerciantes, deliverys] = await Promise.all([
      User.findAll({
        where: { rol: 'comerciante' },
        attributes: ['id', 'nombre', 'email', 'saldo'],
        order: [['nombre', 'ASC']],
      }),
      User.findAll({
        where: { rol: 'delivery' },
        attributes: ['id', 'nombre', 'email', 'saldo'],
        order: [['nombre', 'ASC']],
      }),
    ]);

    const movimientos = await MovimientoWallet.findAll({
      where: { usuarioId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
      include: [{ model: Pedido, as: 'pedido', attributes: ['id', 'numeroPedido'], required: false }],
    });

    res.json({
      saldoAdmin: parseFloat(admin.saldo),
      comerciantes: comerciantes.map(c => ({ ...c.toJSON(), saldo: parseFloat(c.saldo) })),
      deliverys:    deliverys.map(d => ({ ...d.toJSON(), saldo: parseFloat(d.saldo) })),
      movimientos,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

// POST /wallet/admin/ajuste  (solo admin)
// Body: { usuarioId, monto, descripcion }  — monto puede ser negativo
const ajuste = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { usuarioId, monto, descripcion } = req.body;
    if (!usuarioId || monto === undefined || !descripcion) {
      await t.rollback();
      return res.status(400).json({ error: 'Faltan datos: usuarioId, monto, descripcion' });
    }

    const usuario = await User.findByPk(usuarioId);
    if (!usuario) {
      await t.rollback();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const saldoNuevo = await mover(usuarioId, parseFloat(monto), 'ajuste', descripcion, null, t);
    await t.commit();

    res.json({ saldoNuevo, mensaje: `Ajuste de $${monto} aplicado a ${usuario.nombre}` });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al aplicar ajuste' });
  }
};

// POST /wallet/retiro  (admin, comerciante, delivery)
// Body: { monto }
const retirar = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const monto = parseFloat(req.body.monto);
    if (!monto || monto <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'El monto debe ser mayor a $0' });
    }

    const usuario = await User.findByPk(req.user.id, { attributes: ['id', 'saldo'], transaction: t });
    if (parseFloat(usuario.saldo) < monto) {
      await t.rollback();
      return res.status(400).json({ error: 'Saldo insuficiente para realizar el retiro' });
    }

    const saldoNuevo = await mover(
      req.user.id,
      -monto,
      'retiro',
      `Retiro de fondos: $${monto.toLocaleString('es-AR')}`,
      null,
      t
    );

    await t.commit();
    res.json({ saldoNuevo, mensaje: `Se retiraron $${monto.toLocaleString('es-AR')} de tu billetera` });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al procesar el retiro' });
  }
};

// POST /wallet/deposito  (solo delivery)
// Body: { monto }
const depositar = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const monto = parseFloat(req.body.monto);
    if (!monto || monto <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'El monto debe ser mayor a $0' });
    }

    const saldoNuevo = await mover(
      req.user.id,
      monto,
      'deposito',
      `Carga de saldo: $${monto.toLocaleString('es-AR')}`,
      null,
      t
    );

    await t.commit();
    res.json({ saldoNuevo, mensaje: `Se acreditaron $${monto.toLocaleString('es-AR')} a tu billetera` });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al cargar saldo' });
  }
};

module.exports = { miBilletera, resumenAdmin, ajuste, depositar, retirar };
