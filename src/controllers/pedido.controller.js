const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Pedido, DetallePedido, Producto, Comercio, User } = require('../models');
const { sendPush } = require('../utils/notifications');
const { distribuirPedido, distribuirRetiroEfectivo } = require('../services/wallet.service');
const { crearNotificacion } = require('../services/notificacion.service');

const generarCodigo = () => String(Math.floor(1000 + Math.random() * 9000));

const haversineMetros = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Genera número de pedido único: CS-2024-XXXXX
const generarNumeroPedido = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `CS-${year}-${random}`;
};

const ESTADOS_ACTIVOS = ['pendiente', 'preparando', 'listo', 'en_entrega'];

// Transiciones válidas de estado
const TRANSICIONES = {
  pendiente:   { siguiente: 'preparando', cancelable: true },
  preparando:  { siguiente: 'listo',      cancelable: true },
  listo:       { siguiente: 'en_entrega', cancelable: false },
  en_entrega:  { siguiente: 'entregado',  cancelable: false },
  entregado:   { siguiente: null,         cancelable: false },
  cancelado:   { siguiente: null,         cancelable: false },
};

// Quién puede cambiar a qué estado
const PERMISOS_ESTADO = {
  preparando: ['comerciante', 'admin'],
  listo:      ['comerciante', 'admin'],
  en_entrega: ['delivery', 'admin'],
  entregado:  ['delivery', 'admin', 'comerciante'],
  cancelado:  ['cliente', 'comerciante', 'admin'],
};

const crear = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { comercioId, items, direccionEntrega, latitudEntrega, longitudEntrega, metodoPago, notas, tipoEntrega = 'delivery', programadoPara } = req.body;
    const clienteId = req.user.id;

    // Validar comercio abierto
    const comercio = await Comercio.findByPk(comercioId);
    if (!comercio || comercio.estado !== 'abierto') {
      await t.rollback();
      return res.status(400).json({ error: 'El comercio no está disponible' });
    }

    // Validar zona de cobertura (solo delivery con coordenadas)
    if (tipoEntrega === 'delivery' && latitudEntrega != null && longitudEntrega != null && comercio.latitud != null && comercio.longitud != null) {
      const distancia = haversineMetros(comercio.latitud, comercio.longitud, latitudEntrega, longitudEntrega);
      const zonaMax = comercio.zonaCobertura || 5000;
      if (distancia > zonaMax) {
        await t.rollback();
        return res.status(400).json({ error: `Tu dirección está fuera de la zona de cobertura (máx ${Math.round(zonaMax / 1000)} km)` });
      }
    }

    // Validar que el cliente no tenga pedido activo en este comercio
    const pedidoActivo = await Pedido.findOne({
      where: { clienteId, comercioId, estado: { [Op.in]: ESTADOS_ACTIVOS } },
    });
    if (pedidoActivo) {
      await t.rollback();
      return res.status(409).json({ error: 'Ya tenés un pedido activo en este comercio' });
    }

    // Validar productos y calcular subtotal
    let subtotal = 0;
    const detallesData = [];
    for (const item of items) {
      const producto = await Producto.findOne({
        where: { id: item.productoId, comercioId, disponible: true },
      });
      if (!producto) {
        await t.rollback();
        return res.status(400).json({ error: `Producto ${item.productoId} no disponible` });
      }
      const itemSubtotal = parseFloat(producto.precio) * item.cantidad;
      subtotal += itemSubtotal;
      detallesData.push({
        productoId: producto.id,
        nombreProducto: producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: producto.precio,
        subtotal: itemSubtotal,
        tiempoPreparacion: producto.tiempoPreparacion || null,
        variantes: item.variantes || null,
        observaciones: item.observaciones?.trim() || null,
      });
    }

    const costoEnvio = tipoEntrega === 'retiro' ? 0 : (parseFloat(comercio.costoEnvio) || 0);
    const total = subtotal + costoEnvio;
    const expiraEn = new Date(Date.now() + 5 * 60 * 1000);

    const pedido = await Pedido.create({
      clienteId,
      comercioId,
      direccionEntrega,
      ...(latitudEntrega  != null ? { latitudEntrega }  : {}),
      ...(longitudEntrega != null ? { longitudEntrega } : {}),
      subtotal,
      costoEnvio,
      descuento: 0,
      total,
      metodoPago,
      notas,
      tipoEntrega,
      programadoPara: programadoPara ? new Date(programadoPara) : null,
      numeroPedido: generarNumeroPedido(),
      estado: programadoPara ? 'programado' : 'pendiente',
      expiraEn: programadoPara ? null : expiraEn,
      codigoRetiro:  generarCodigo(),
      codigoEntrega: generarCodigo(),
    }, { transaction: t });

    await DetallePedido.bulkCreate(
      detallesData.map(d => ({ ...d, pedidoId: pedido.id })),
      { transaction: t }
    );

    await t.commit();

    const pedidoCompleto = await Pedido.findByPk(pedido.id, {
      include: [
        { model: DetallePedido, as: 'detalles' },
        { model: Comercio, as: 'comercio', attributes: ['id', 'nombre', 'direccion'] },
        { model: User, as: 'cliente', attributes: ['id', 'nombre', 'telefono'] },
      ],
    });

    // Notificar al comerciante en tiempo real
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${comercio.usuarioId}`).emit('pedido:nuevo', {
        pedidoId: pedidoCompleto.id,
        numeroPedido: pedidoCompleto.numeroPedido,
        total: pedidoCompleto.total,
      });
    }

    // Push al comerciante
    const propietario = await User.findByPk(comercio.usuarioId, { attributes: ['fcmToken'] });
    const esProgramado = !!pedidoCompleto.programadoPara;
    const pushTitle = esProgramado ? '🗓️ Nuevo encargue' : '🛒 Nuevo pedido';
    const pushBody  = esProgramado
      ? `Pedido #${pedidoCompleto.numeroPedido} para el ${new Date(pedidoCompleto.programadoPara).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
      : `Pedido #${pedidoCompleto.numeroPedido} · $${pedidoCompleto.total}`;
    sendPush(propietario?.fcmToken, pushTitle, pushBody, { pedidoId: pedidoCompleto.id });

    // Notificación interna al comerciante
    crearNotificacion(comercio.usuarioId, {
      tipo:    'pedido',
      emoji:   esProgramado ? '🗓️' : '🛒',
      titulo:  esProgramado ? 'Nuevo encargue' : 'Nuevo pedido',
      mensaje: `${pedidoCompleto.cliente?.nombre || 'Cliente'} — #${pedidoCompleto.numeroPedido} · $${pedidoCompleto.total}`,
      data:    { pedidoId: pedidoCompleto.id },
    }).catch(console.error);

    res.status(201).json(pedidoCompleto);
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al crear pedido' });
  }
};

const obtener = async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id, {
      include: [
        { model: DetallePedido, as: 'detalles' },
        { model: Comercio, as: 'comercio', attributes: ['id', 'nombre', 'direccion', 'telefono', 'latitud', 'longitud'] },
        { model: User, as: 'cliente', attributes: ['id', 'nombre', 'telefono'] },
        { model: User, as: 'delivery', attributes: ['id', 'nombre', 'telefono', 'foto', 'rating'] },
      ],
    });
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    // Solo puede ver su propio pedido (o admin, o el comerciante dueño del comercio)
    const { id, rol } = req.user;
    const esPropio = pedido.clienteId === id || pedido.deliveryId === id;
    const esComerciantePropietario = rol === 'comerciante' && pedido.comercio?.usuarioId === id;
    if (rol !== 'admin' && !esPropio && !esComerciantePropietario) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    res.json(pedido);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
};

const listarMisPedidos = async (req, res) => {
  try {
    const { estado, limit = 20, offset = 0 } = req.query;
    const where = { clienteId: req.user.id };
    if (estado) where.estado = estado;

    const pedidos = await Pedido.findAndCountAll({
      where,
      include: [
        { model: DetallePedido, as: 'detalles' },
        { model: Comercio, as: 'comercio', attributes: ['id', 'nombre', 'foto'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.json(pedidos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

const listarPedidosComercio = async (req, res) => {
  try {
    const { comercioId } = req.params;
    const { estado } = req.query;

    const comercio = await Comercio.findByPk(comercioId);
    if (!comercio) return res.status(404).json({ error: 'Comercio no encontrado' });

    if (req.user.rol !== 'admin' && comercio.usuarioId !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const where = { comercioId };
    if (estado) {
      where.estado = { [Op.in]: estado.split(',') };
    } else {
      where.estado = { [Op.in]: ESTADOS_ACTIVOS };
    }

    const pedidos = await Pedido.findAll({
      where,
      include: [
        { model: DetallePedido, as: 'detalles' },
        { model: User, as: 'cliente', attributes: ['id', 'nombre', 'telefono'] },
        { model: User, as: 'delivery', attributes: ['id', 'nombre', 'telefono'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(pedidos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pedidos del comercio' });
  }
};

const listarPedidosDelivery = async (req, res) => {
  try {
    const { estado, limit = 20, offset = 0 } = req.query;
    const where = { deliveryId: req.user.id };
    if (estado) where.estado = { [Op.in]: estado.split(',') };

    const pedidos = await Pedido.findAndCountAll({
      where,
      include: [
        { model: DetallePedido, as: 'detalles' },
        { model: Comercio, as: 'comercio', attributes: ['id', 'nombre', 'direccion', 'telefono'] },
        { model: User, as: 'cliente', attributes: ['id', 'nombre', 'telefono'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.json(pedidos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener entregas' });
  }
};

const cambiarEstado = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { estado, motivoCancelacion } = req.body;
    const { id: userId, rol } = req.user;

    const pedido = await Pedido.findByPk(req.params.id, { transaction: t });
    if (!pedido) {
      await t.rollback();
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    // Verificar permiso para este estado
    const rolesPermitidos = PERMISOS_ESTADO[estado];
    if (!rolesPermitidos || !rolesPermitidos.includes(rol)) {
      await t.rollback();
      return res.status(403).json({ error: 'No podés cambiar a ese estado' });
    }

    // Validar transición válida
    const transicion = TRANSICIONES[pedido.estado];
    const esCancelacion = estado === 'cancelado';
    // Retiro: se salta "en_entrega", va directo listo → entregado
    const esRetiroDirecto = estado === 'entregado' && pedido.tipoEntrega === 'retiro' && pedido.estado === 'listo';
    if (!esCancelacion && !esRetiroDirecto && transicion.siguiente !== estado) {
      await t.rollback();
      return res.status(400).json({ error: `No se puede pasar de "${pedido.estado}" a "${estado}"` });
    }
    if (esCancelacion && !transicion.cancelable) {
      await t.rollback();
      return res.status(400).json({ error: 'Este pedido ya no se puede cancelar' });
    }

    // Validaciones específicas por rol
    if (rol === 'comerciante') {
      const comercio = await Comercio.findByPk(pedido.comercioId);
      if (comercio.usuarioId !== userId) {
        await t.rollback();
        return res.status(403).json({ error: 'Sin permiso sobre este pedido' });
      }
      // Comerciante solo puede marcar "entregado" en pedidos de retiro
      if (estado === 'entregado' && pedido.tipoEntrega !== 'retiro') {
        await t.rollback();
        return res.status(403).json({ error: 'Solo el delivery puede confirmar la entrega a domicilio' });
      }
    }

    // Retiro: verificar código del cliente antes de marcar entregado
    if (estado === 'entregado' && pedido.tipoEntrega === 'retiro') {
      const { codigoVerificacion } = req.body;
      if (!codigoVerificacion || String(pedido.codigoEntrega) !== String(codigoVerificacion)) {
        await t.rollback();
        return res.status(400).json({ error: 'Código de verificación incorrecto' });
      }
    }
    if (rol === 'delivery' && pedido.deliveryId !== userId) {
      await t.rollback();
      return res.status(403).json({ error: 'Este pedido no es tuyo' });
    }
    if (rol === 'cliente' && pedido.clienteId !== userId) {
      await t.rollback();
      return res.status(403).json({ error: 'Este pedido no es tuyo' });
    }

    const updates = { estado };
    if (estado === 'entregado') updates.horaEntregaReal = new Date();
    if (estado === 'cancelado' && motivoCancelacion) updates.motivoCancelacion = motivoCancelacion;

    await pedido.update(updates, { transaction: t });
    await t.commit();

    // Comisión retiro en efectivo: el comercio le debe la comisión al admin
    if (estado === 'entregado' && pedido.tipoEntrega === 'retiro' && pedido.metodoPago === 'efectivo') {
      const pedidoConComercio = await Pedido.findByPk(pedido.id, {
        include: [{ model: Comercio, as: 'comercio', attributes: ['id', 'usuarioId', 'comisionPorcentaje'] }],
      });
      try {
        await distribuirRetiroEfectivo(pedidoConComercio);
        // Notificar comisión al comerciante
        const comisionPct = parseFloat(pedidoConComercio.comercio?.comisionPorcentaje ?? 10);
        const comision    = parseFloat((parseFloat(pedido.subtotal) * comisionPct / 100).toFixed(2));
        crearNotificacion(pedidoConComercio.comercio.usuarioId, {
          tipo:    'wallet',
          emoji:   '💸',
          titulo:  'Comisión descontada',
          mensaje: `-$${comision.toFixed(2)} por pedido #${pedido.numeroPedido} (retiro efectivo)`,
          data:    { screen: 'Billetera' },
        }).catch(console.error);
      } catch (walletErr) {
        console.error('[wallet] Fallo en distribución retiro efectivo:', walletErr.message);
      }
    }

    // Notificar en tiempo real
    const io = req.app.get('io');
    if (io) {
      const payload = { pedidoId: pedido.id, numeroPedido: pedido.numeroPedido, estado: pedido.estado };

      // Sala del pedido (tracking)
      io.to(`pedido:${pedido.id}`).emit('pedido:estado-actualizado', payload);

      // Sala personal del cliente
      io.to(`user:${pedido.clienteId}`).emit('pedido:estado-actualizado', payload);

      // Cuando pasa a "listo" y es delivery, notificar a los repartidores
      if (estado === 'listo' && pedido.tipoEntrega === 'delivery') {
        io.emit('pedido:nuevo-disponible', { pedidoId: pedido.id });
      }
    }

    // Push según el nuevo estado
    const MENSAJES_CLIENTE = {
      preparando: { title: '👨‍🍳 Preparando tu pedido', body: `Tu pedido #${pedido.numeroPedido} está en preparación.` },
      listo:      { title: '✅ Pedido listo', body: `Tu pedido #${pedido.numeroPedido} está listo para ser retirado.` },
      en_entrega: { title: '🛵 Tu pedido va en camino', body: `¡Tu repartidor ya salió con el pedido #${pedido.numeroPedido}!` },
      entregado:  { title: '🎉 ¡Pedido entregado!', body: `El pedido #${pedido.numeroPedido} fue entregado. ¡Buen provecho!` },
      cancelado:  { title: '❌ Pedido cancelado', body: `El pedido #${pedido.numeroPedido} fue cancelado.` },
    };

    if (MENSAJES_CLIENTE[estado]) {
      const cliente = await User.findByPk(pedido.clienteId, { attributes: ['fcmToken'] });
      sendPush(cliente?.fcmToken, MENSAJES_CLIENTE[estado].title, MENSAJES_CLIENTE[estado].body, { pedidoId: pedido.id });
    }

    if (estado === 'listo' && pedido.tipoEntrega === 'delivery') {
      const deliverys = await User.findAll({
        where: { rol: 'delivery', enLinea: true, fcmToken: { [Op.not]: null } },
        attributes: ['fcmToken'],
      });
      sendPush(deliverys.map(d => d.fcmToken), '📦 Nuevo pedido disponible', `Hay un pedido listo para retirar cerca tuyo.`, { pedidoId: pedido.id });
    }

    // Notificaciones internas
    const NOTIF_CLIENTE = {
      preparando: { emoji: '👨‍🍳', titulo: 'Pedido en preparación',   mensaje: `Tu pedido #${pedido.numeroPedido} está siendo preparado` },
      listo:      { emoji: pedido.tipoEntrega === 'retiro' ? '✅' : '⏳', titulo: pedido.tipoEntrega === 'retiro' ? 'Listo para retirar' : 'Pedido listo', mensaje: pedido.tipoEntrega === 'retiro' ? `Tu pedido #${pedido.numeroPedido} está listo para retirar en el local` : `Tu pedido #${pedido.numeroPedido} está esperando al repartidor` },
      en_entrega: { emoji: '🛵', titulo: 'En camino',               mensaje: `Tu pedido #${pedido.numeroPedido} ya va en camino` },
      entregado:  { emoji: '🎉', titulo: '¡Pedido entregado!',      mensaje: `Tu pedido #${pedido.numeroPedido} fue entregado. ¡Buen provecho!` },
      cancelado:  { emoji: '❌', titulo: 'Pedido cancelado',         mensaje: `Tu pedido #${pedido.numeroPedido} fue cancelado${motivoCancelacion ? ': ' + motivoCancelacion : ''}` },
    };
    const notifCfg = NOTIF_CLIENTE[estado];
    if (notifCfg) {
      crearNotificacion(pedido.clienteId, { tipo: 'pedido', ...notifCfg, data: { pedidoId: pedido.id } }).catch(console.error);
    }

    res.json({ id: pedido.id, numeroPedido: pedido.numeroPedido, estado: pedido.estado });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};

const aceptarDelivery = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const deliveryId = req.user.id;

    // Verificar que el delivery no tenga entregas activas
    const entregaActiva = await Pedido.findOne({
      where: { deliveryId, estado: { [Op.in]: ['listo', 'en_entrega'] } },
    });
    if (entregaActiva) {
      await t.rollback();
      return res.status(409).json({ error: 'Ya tenés una entrega activa' });
    }

    const pedido = await Pedido.findByPk(req.params.id, { transaction: t });
    if (!pedido) {
      await t.rollback();
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (pedido.estado !== 'listo') {
      await t.rollback();
      return res.status(400).json({ error: 'El pedido no está listo para ser recogido' });
    }
    if (pedido.deliveryId) {
      await t.rollback();
      return res.status(409).json({ error: 'Este pedido ya tiene delivery asignado' });
    }

    // Verificar saldo suficiente para pedidos en efectivo
    if (pedido.metodoPago === 'efectivo') {
      const deliveryUser = await User.findByPk(deliveryId, { attributes: ['saldo'] });
      if (parseFloat(deliveryUser.saldo) < parseFloat(pedido.total)) {
        await t.rollback();
        return res.status(400).json({
          error: `Saldo Insuficiente: Pedido con pago en efectivo $${parseFloat(pedido.total).toFixed(2)}. Tu saldo actual: $${parseFloat(deliveryUser.saldo).toFixed(2)}`,
        });
      }
    }

    // Solo asigna el delivery — el estado cambia a "en_entrega" cuando el delivery ingresa el código de retiro
    await pedido.update({ deliveryId }, { transaction: t });
    await t.commit();

    // Notificar al comerciante que un delivery tomó el pedido
    const comercioDelPedido = await Comercio.findByPk(pedido.comercioId, { attributes: ['usuarioId'] });
    if (comercioDelPedido) {
      crearNotificacion(comercioDelPedido.usuarioId, {
        tipo:    'pedido',
        emoji:   '🛵',
        titulo:  'Delivery en camino',
        mensaje: `Un repartidor tomó el pedido #${pedido.numeroPedido} y va hacia tu comercio`,
        data:    { pedidoId: pedido.id },
      }).catch(console.error);
    }

    res.json({ id: pedido.id, numeroPedido: pedido.numeroPedido, estado: pedido.estado, deliveryId });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al aceptar pedido' });
  }
};

const confirmarRetiro = async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (pedido.deliveryId !== req.user.id) return res.status(403).json({ error: 'Sin permiso' });
    if (pedido.estado !== 'listo') return res.status(400).json({ error: 'El pedido no está listo para retirar' });
    if (String(pedido.codigoRetiro) !== String(req.body.codigo)) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }

    await pedido.update({ estado: 'en_entrega' });

    const io = req.app.get('io');
    if (io) {
      io.to(`pedido:${pedido.id}`).emit('pedido:estado', { estado: 'en_entrega' });
      io.to(`user:${pedido.clienteId}`).emit('pedido:estado', { estado: 'en_entrega' });
    }

    const cliente = await User.findByPk(pedido.clienteId, { attributes: ['fcmToken'] });
    sendPush(cliente?.fcmToken, '🛵 Tu pedido va en camino', `¡Tu repartidor ya salió con el pedido #${pedido.numeroPedido}!`, { pedidoId: pedido.id });

    crearNotificacion(pedido.clienteId, {
      tipo:    'pedido',
      emoji:   '🛵',
      titulo:  'Tu pedido va en camino',
      mensaje: `El repartidor ya salió con tu pedido #${pedido.numeroPedido}`,
      data:    { pedidoId: pedido.id },
    }).catch(console.error);

    res.json({ id: pedido.id, estado: 'en_entrega' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al confirmar retiro' });
  }
};

const confirmarEntrega = async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id, {
      include: [{ model: Comercio, as: 'comercio', attributes: ['id', 'usuarioId', 'comisionPorcentaje'] }],
    });
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (pedido.deliveryId !== req.user.id) return res.status(403).json({ error: 'Sin permiso' });
    if (pedido.estado !== 'en_entrega') return res.status(400).json({ error: 'El pedido no está en camino' });
    if (String(pedido.codigoEntrega) !== String(req.body.codigo)) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }

    await pedido.update({ estado: 'entregado', horaEntregaReal: new Date() });

    // Distribuir fondos en billeteras
    try {
      await distribuirPedido(pedido);
    } catch (walletErr) {
      console.error('[wallet] Fallo en distribución (no revierte entrega):', walletErr.message);
    }

    const io = req.app.get('io');
    if (io) {
      io.to(`pedido:${pedido.id}`).emit('pedido:estado', { estado: 'entregado' });
      io.to(`user:${pedido.clienteId}`).emit('pedido:estado', { estado: 'entregado' });
    }

    const cliente = await User.findByPk(pedido.clienteId, { attributes: ['fcmToken'] });
    sendPush(cliente?.fcmToken, '🎉 ¡Pedido entregado!', `El pedido #${pedido.numeroPedido} fue entregado. ¡Buen provecho!`, { pedidoId: pedido.id });

    // Notificación interna al cliente
    crearNotificacion(pedido.clienteId, {
      tipo:    'pedido',
      emoji:   '🎉',
      titulo:  '¡Pedido entregado!',
      mensaje: `Tu pedido #${pedido.numeroPedido} fue entregado. ¡Buen provecho!`,
      data:    { pedidoId: pedido.id },
    }).catch(console.error);

    // Notificaciones de wallet al comerciante y al delivery
    if (pedido.comercio) {
      const subtotal        = parseFloat(pedido.subtotal);
      const costoEnvio      = parseFloat(pedido.costoEnvio);
      const comisionPct     = parseFloat(pedido.comercio.comisionPorcentaje ?? 10);
      const comision        = parseFloat((subtotal * comisionPct / 100).toFixed(2));
      const comercianteNet  = parseFloat((subtotal - comision).toFixed(2));
      crearNotificacion(pedido.comercio.usuarioId, {
        tipo:    'wallet',
        emoji:   '💰',
        titulo:  'Pago acreditado',
        mensaje: `+$${comercianteNet.toFixed(2)} por pedido #${pedido.numeroPedido}`,
        data:    { screen: 'Billetera' },
      }).catch(console.error);
      if (pedido.deliveryId && costoEnvio > 0) {
        crearNotificacion(pedido.deliveryId, {
          tipo:    'wallet',
          emoji:   '💰',
          titulo:  'Ganancia acreditada',
          mensaje: `+$${costoEnvio.toFixed(2)} por entrega #${pedido.numeroPedido}`,
          data:    { screen: 'Billetera' },
        }).catch(console.error);
      }
    }

    res.json({ id: pedido.id, estado: 'entregado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al confirmar entrega' });
  }
};

const calificar = async (req, res) => {
  try {
    const { calificacionComercio, calificacionDelivery, comentario } = req.body;
    const pedido = await Pedido.findByPk(req.params.id);

    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (pedido.clienteId !== req.user.id) return res.status(403).json({ error: 'Sin permiso' });
    if (pedido.estado !== 'entregado') return res.status(400).json({ error: 'Solo podés calificar pedidos entregados' });
    if (pedido.calificacionComercio) return res.status(409).json({ error: 'Ya calificaste este pedido' });

    await pedido.update({ calificacionComercio, calificacionDelivery, comentarioCliente: comentario });

    // Actualizar rating del comercio
    if (calificacionComercio) {
      const comercio = await Comercio.findByPk(pedido.comercioId);
      const nuevoTotal = (comercio.rating * comercio.numCalificaciones) + calificacionComercio;
      const nuevoNum = comercio.numCalificaciones + 1;
      await comercio.update({ rating: nuevoTotal / nuevoNum, numCalificaciones: nuevoNum });
    }

    // Actualizar rating del delivery
    if (calificacionDelivery && pedido.deliveryId) {
      const delivery = await User.findByPk(pedido.deliveryId);
      const pedidosCalificados = await Pedido.count({
        where: { deliveryId: pedido.deliveryId, calificacionDelivery: { [Op.not]: null } },
      });
      const sumaActual = delivery.rating ? delivery.rating * pedidosCalificados : 0;
      const nuevoRating = (sumaActual + calificacionDelivery) / (pedidosCalificados + 1);
      await delivery.update({ rating: nuevoRating, numCalificaciones: pedidosCalificados + 1 });
    }

    res.json({ message: 'Calificación guardada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al calificar' });
  }
};

// Pedidos disponibles para delivery (estado "listo", sin delivery asignado)
const pedidosDisponibles = async (req, res) => {
  try {
    const pedidos = await Pedido.findAll({
      where: { estado: 'listo', deliveryId: null, tipoEntrega: 'delivery' },
      include: [
        { model: Comercio,      as: 'comercio', attributes: ['id', 'nombre', 'direccion', 'latitud', 'longitud'] },
        { model: User,          as: 'cliente',  attributes: ['id', 'nombre'] },
        { model: DetallePedido, as: 'detalles', attributes: ['id', 'cantidad', 'nombreProducto'] },
      ],
      order: [['createdAt', 'ASC']],
    });
    res.json(pedidos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pedidos disponibles' });
  }
};

// Historial de pedidos del comercio propio (entregado/cancelado) con filtro de fecha y totales
const historialComercio = async (req, res) => {
  try {
    const comercio = await Comercio.findOne({ where: { usuarioId: req.user.id } });
    if (!comercio) return res.status(404).json({ error: 'Comercio no encontrado' });

    const { desde, hasta, limit = 50, offset = 0 } = req.query;

    const where = {
      comercioId: comercio.id,
      estado: { [Op.in]: ['entregado', 'cancelado'] },
    };

    if (desde || hasta) {
      where.createdAt = {};
      if (desde) where.createdAt[Op.gte] = new Date(desde);
      if (hasta) {
        const hastaFin = new Date(hasta);
        hastaFin.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = hastaFin;
      }
    }

    const { rows: pedidos, count } = await Pedido.findAndCountAll({
      where,
      include: [
        { model: DetallePedido, as: 'detalles' },
        { model: User, as: 'cliente', attributes: ['id', 'nombre'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const totalVentas = pedidos
      .filter(p => p.estado === 'entregado')
      .reduce((sum, p) => sum + parseFloat(p.total || 0), 0);

    res.json({ pedidos, count, totalVentas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

// Pedidos activos del comercio propio (sin necesitar comercioId en URL)
const activosComercio = async (req, res) => {
  try {
    const comercio = await Comercio.findOne({ where: { usuarioId: req.user.id } });
    if (!comercio) return res.status(404).json({ error: 'Comercio no encontrado' });

    const pedidos = await Pedido.findAll({
      where: { comercioId: comercio.id, estado: { [Op.in]: ESTADOS_ACTIVOS } },
      include: [
        { model: DetallePedido, as: 'detalles' },
        { model: User, as: 'cliente', attributes: ['id', 'nombre', 'telefono'] },
      ],
      order: [['createdAt', 'ASC']],
    });
    res.json(pedidos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pedidos activos' });
  }
};

const liberarPedido = async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (pedido.deliveryId !== req.user.id) return res.status(403).json({ error: 'Este pedido no es tuyo' });
    if (pedido.estado !== 'listo') return res.status(400).json({ error: 'Solo podés liberar pedidos que todavía no retiraste' });

    await pedido.update({ deliveryId: null });

    const io = req.app.get('io');
    if (io) io.emit('pedido:nuevo-disponible', { pedidoId: pedido.id });

    res.json({ id: pedido.id, mensaje: 'Pedido liberado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al liberar pedido' });
  }
};

const alertarLlegada = async (req, res) => {
  try {
    const pedido = await Pedido.findByPk(req.params.id, {
      include: [{ model: User, as: 'cliente', attributes: ['id', 'nombre', 'fcmToken'] }],
    });
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (pedido.deliveryId !== req.user.id) return res.status(403).json({ error: 'Sin permiso sobre este pedido' });
    if (pedido.estado !== 'en_entrega') return res.status(400).json({ error: 'El pedido no está en camino' });

    // Notificación in-app al cliente
    if (pedido.cliente) {
      await crearNotificacion(pedido.cliente.id, {
        tipo:    'pedido',
        emoji:   '📍',
        titulo:  '¡Tu pedido llegó!',
        mensaje: `El repartidor está en tu puerta con el pedido #${pedido.numeroPedido}`,
        data:    { pedidoId: pedido.id, screen: 'Tracking' },
      });

      // Push notification
      if (pedido.cliente.fcmToken) {
        sendPush(
          pedido.cliente.fcmToken,
          '📍 ¡Tu pedido llegó!',
          `El repartidor está en tu puerta con el pedido #${pedido.numeroPedido}`,
          { pedidoId: pedido.id },
        ).catch(console.error);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar alerta' });
  }
};

module.exports = {
  crear,
  obtener,
  listarMisPedidos,
  listarPedidosComercio,
  listarPedidosDelivery,
  activosComercio,
  historialComercio,
  cambiarEstado,
  aceptarDelivery,
  liberarPedido,
  confirmarRetiro,
  confirmarEntrega,
  calificar,
  alertarLlegada,
  pedidosDisponibles,
};
