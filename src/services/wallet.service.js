const sequelize = require('../config/database');
const { User, MovimientoWallet } = require('../models');

/**
 * Registra un movimiento en la wallet de un usuario.
 * Actualiza el saldo atómicamente y guarda el historial.
 */
const mover = async (usuarioId, monto, concepto, descripcion, pedidoId = null, t) => {
  const usuario = await User.findByPk(usuarioId, {
    attributes: ['id', 'saldo'],
    lock: t.LOCK.UPDATE,
    transaction: t,
  });
  if (!usuario) throw new Error(`Usuario ${usuarioId} no encontrado`);

  const saldoAnterior = parseFloat(usuario.saldo);
  const saldoNuevo    = parseFloat((saldoAnterior + monto).toFixed(2));

  await usuario.update({ saldo: saldoNuevo }, { transaction: t });

  await MovimientoWallet.create({
    usuarioId,
    pedidoId,
    tipo:        monto >= 0 ? 'credito' : 'debito',
    concepto,
    monto:       Math.abs(monto),
    descripcion,
    saldoAnterior,
    saldoNuevo,
  }, { transaction: t });

  return saldoNuevo;
};

/**
 * Distribuye el dinero de un pedido entregado.
 * Llamar dentro de una transacción existente.
 *
 * Fórmulas:
 *   comision        = subtotal × (comisionPorcentaje / 100)
 *   comercianteShare = subtotal − comision
 *   deliveryShare    = costoEnvio
 *   adminNeto        = comision
 *
 * Efectivo: delivery recibe el cash físico → se debita su wallet por total,
 *           luego se acredita su deliveryShare (neto: −subtotal).
 * Transferencia: admin recibió el dinero externamente → se acredita por total,
 *                luego distribuye.
 */
const distribuirPedido = async (pedido) => {
  const t = await sequelize.transaction();
  try {
    const subtotal       = parseFloat(pedido.subtotal);
    const costoEnvio     = parseFloat(pedido.costoEnvio);
    const total          = parseFloat(pedido.total);
    const comisionPct    = parseFloat(pedido.comercio?.comisionPorcentaje ?? 10);
    const comision       = parseFloat((subtotal * comisionPct / 100).toFixed(2));
    const comercianteShare = parseFloat((subtotal - comision).toFixed(2));
    const deliveryShare  = costoEnvio;
    const num            = pedido.numeroPedido;
    const pid            = pedido.id;
    const deliveryId     = pedido.deliveryId;
    const comercianteUserId = pedido.comercio.usuarioId;

    // Encontrar el Admin Principal (el primer admin creado)
    const admin = await User.findOne({
      where: { rol: 'admin' },
      order: [['createdAt', 'ASC']],
      attributes: ['id'],
      transaction: t,
    });
    if (!admin) throw new Error('No hay admin configurado');

    if (pedido.metodoPago === 'efectivo') {
      // Delivery cobró el efectivo físicamente → debe el total al sistema
      await mover(deliveryId,  -total, 'efectivo_cobrado', `Efectivo cobrado pedido #${num}`, pid, t);
      // Admin recibe conceptualmente ese total
      await mover(admin.id,   +total, 'pago_recibido',    `Efectivo pedido #${num}`,          pid, t);
    } else {
      // Transferencia / tarjeta: admin recibió el dinero del cliente
      await mover(admin.id,   +total, 'pago_recibido', `Pago pedido #${num}`, pid, t);
    }

    // Admin paga al comerciante
    await mover(admin.id,          -comercianteShare, 'comision',  `Pago a comercio pedido #${num}`,  pid, t);
    await mover(comercianteUserId, +comercianteShare, 'venta',     `Venta pedido #${num}`,             pid, t);

    // Admin paga al delivery
    await mover(admin.id,   -deliveryShare, 'comision', `Pago delivery pedido #${num}`, pid, t);
    await mover(deliveryId, +deliveryShare, 'delivery', `Tarifa entrega pedido #${num}`, pid, t);

    await t.commit();
  } catch (err) {
    await t.rollback();
    console.error('[wallet] Error al distribuir pedido:', err.message);
    throw err;
  }
};

/**
 * Para pedidos de retiro + efectivo:
 * el comercio cobró el efectivo directamente al cliente,
 * por lo que le debe la comisión al admin.
 */
const distribuirRetiroEfectivo = async (pedido) => {
  const t = await sequelize.transaction();
  try {
    const subtotal      = parseFloat(pedido.subtotal);
    const comisionPct   = parseFloat(pedido.comercio?.comisionPorcentaje ?? 10);
    const comision      = parseFloat((subtotal * comisionPct / 100).toFixed(2));
    const num           = pedido.numeroPedido;
    const pid           = pedido.id;
    const comercianteUserId = pedido.comercio.usuarioId;

    const admin = await User.findOne({
      where: { rol: 'admin' },
      order: [['createdAt', 'ASC']],
      attributes: ['id'],
      transaction: t,
    });
    if (!admin) throw new Error('No hay admin configurado');

    await mover(comercianteUserId, -comision, 'comision',      `Comisión retiro efectivo pedido #${num}`, pid, t);
    await mover(admin.id,         +comision, 'pago_recibido', `Comisión retiro efectivo pedido #${num}`, pid, t);

    await t.commit();
  } catch (err) {
    await t.rollback();
    console.error('[wallet] Error en distribución retiro efectivo:', err.message);
    throw err;
  }
};

module.exports = { distribuirPedido, distribuirRetiroEfectivo, mover };
