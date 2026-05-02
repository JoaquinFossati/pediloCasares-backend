const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/database');
const { Pedido, User, Comercio, Transaccion, DetallePedido } = require('../models');

const inicioDelDia = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ── ADMIN DASHBOARD ────────────────────────────────────────────────────

const adminKPIs = async (req, res) => {
  try {
    const hoy = inicioDelDia();

    const [pedidosHoy, ingresosHoy, usuariosActivos, ratingData] = await Promise.all([
      Pedido.count({ where: { estado: 'entregado', horaEntregaReal: { [Op.gte]: hoy } } }),

      Pedido.sum('total', { where: { estado: 'entregado', horaEntregaReal: { [Op.gte]: hoy } } }),

      User.count({ where: { estado: true, ultimoLogin: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),

      Comercio.findOne({
        attributes: [[fn('AVG', col('rating')), 'promedioRating']],
        where: { numCalificaciones: { [Op.gt]: 0 } },
        raw: true,
      }),
    ]);

    res.json({
      pedidosCompletadosHoy: pedidosHoy,
      ingresosHoy: parseFloat(ingresosHoy || 0).toFixed(2),
      usuariosActivos,
      ratingPromedio: parseFloat(ratingData?.promedioRating || 0).toFixed(1),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener KPIs' });
  }
};

const transaccionesPorHora = async (req, res) => {
  try {
    const hoy = inicioDelDia();
    const data = await Pedido.findAll({
      attributes: [
        [fn('date_trunc', 'hour', col('horaEntregaReal')), 'hora'],
        [fn('COUNT', col('id')), 'pedidos'],
        [fn('SUM', col('total')), 'ingresos'],
      ],
      where: { estado: 'entregado', horaEntregaReal: { [Op.gte]: hoy } },
      group: [fn('date_trunc', 'hour', col('horaEntregaReal'))],
      order: [[fn('date_trunc', 'hour', col('horaEntregaReal')), 'ASC']],
      raw: true,
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener transacciones por hora' });
  }
};

const comerciosMasPopulares = async (req, res) => {
  try {
    const { limit = 10, periodo = '30' } = req.query;
    const desde = new Date(Date.now() - parseInt(periodo) * 24 * 60 * 60 * 1000);

    const data = await Pedido.findAll({
      attributes: [
        'comercioId',
        [fn('COUNT', col('Pedido.id')), 'totalPedidos'],
        [fn('SUM', col('total')), 'ingresosTotales'],
      ],
      where: { estado: 'entregado', createdAt: { [Op.gte]: desde } },
      include: [{ model: Comercio, as: 'comercio', attributes: ['nombre', 'foto', 'rating'] }],
      group: ['comercioId', 'comercio.id'],
      order: [[literal('"totalPedidos"'), 'DESC']],
      limit: parseInt(limit),
      raw: false,
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener comercios populares' });
  }
};

const deliveryTopRanking = async (req, res) => {
  try {
    const { limit = 10, periodo = '30' } = req.query;
    const desde = new Date(Date.now() - parseInt(periodo) * 24 * 60 * 60 * 1000);

    const data = await Pedido.findAll({
      attributes: [
        'deliveryId',
        [fn('COUNT', col('Pedido.id')), 'entregasTotal'],
        [fn('AVG', col('calificacionDelivery')), 'ratingPromedio'],
      ],
      where: {
        estado: 'entregado',
        deliveryId: { [Op.not]: null },
        horaEntregaReal: { [Op.gte]: desde },
      },
      include: [{ model: User, as: 'delivery', attributes: ['nombre', 'foto', 'telefono'] }],
      group: ['deliveryId', 'delivery.id'],
      order: [[literal('"entregasTotal"'), 'DESC']],
      limit: parseInt(limit),
      raw: false,
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener ranking de delivery' });
  }
};

const ingresosPorPeriodo = async (req, res) => {
  try {
    const { agrupacion = 'day', dias = '30' } = req.query;
    const desde = new Date(Date.now() - parseInt(dias) * 24 * 60 * 60 * 1000);

    const truncMap = { hour: 'hour', day: 'day', week: 'week', month: 'month' };
    const trunc = truncMap[agrupacion] || 'day';

    const data = await Pedido.findAll({
      attributes: [
        [fn('date_trunc', trunc, col('horaEntregaReal')), 'periodo'],
        [fn('COUNT', col('id')), 'pedidos'],
        [fn('SUM', col('total')), 'ingresos'],
      ],
      where: { estado: 'entregado', horaEntregaReal: { [Op.gte]: desde } },
      group: [fn('date_trunc', trunc, col('horaEntregaReal'))],
      order: [[fn('date_trunc', trunc, col('horaEntregaReal')), 'ASC']],
      raw: true,
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener ingresos por período' });
  }
};

// ── DASHBOARD COMERCIANTE ──────────────────────────────────────────────

const comercianteDashboard = async (req, res) => {
  try {
    const { comercioId } = req.params;
    const comercio = await Comercio.findByPk(comercioId);
    if (!comercio) return res.status(404).json({ error: 'Comercio no encontrado' });
    if (req.user.rol !== 'admin' && comercio.usuarioId !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const hoy = inicioDelDia();
    const ACTIVOS = ['pendiente', 'preparando', 'listo', 'en_entrega'];

    const [pedidosHoy, ingresosHoy, pendientes, preparando, listos, pedidosActivos] = await Promise.all([
      Pedido.count({ where: { comercioId, estado: 'entregado', horaEntregaReal: { [Op.gte]: hoy } } }),
      Pedido.sum('total', { where: { comercioId, estado: 'entregado', horaEntregaReal: { [Op.gte]: hoy } } }),
      Pedido.count({ where: { comercioId, estado: 'pendiente' } }),
      Pedido.count({ where: { comercioId, estado: 'preparando' } }),
      Pedido.count({ where: { comercioId, estado: 'listo' } }),
      Pedido.count({ where: { comercioId, estado: { [Op.in]: ACTIVOS } } }),
    ]);

    res.json({
      comercio: { id: comercio.id, nombre: comercio.nombre, estado: comercio.estado, rating: comercio.rating },
      pedidosHoy,
      ingresosHoy: parseFloat(ingresosHoy || 0).toFixed(2),
      pedidosActivos,
      resumen: { pendientes, preparando, listos },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
};

// ── DASHBOARD DELIVERY ─────────────────────────────────────────────────

const deliveryDashboard = async (req, res) => {
  try {
    const deliveryId = req.user.id;
    const hoy = inicioDelDia();

    const [entregasHoy, entregasTotal, entregaActiva] = await Promise.all([
      Pedido.count({ where: { deliveryId, estado: 'entregado', horaEntregaReal: { [Op.gte]: hoy } } }),
      Pedido.count({ where: { deliveryId, estado: 'entregado' } }),
      Pedido.findOne({
        where: { deliveryId, estado: { [Op.in]: ['listo', 'en_entrega'] } },
        include: [
          { model: Comercio, as: 'comercio', attributes: ['id', 'nombre', 'direccion', 'latitud', 'longitud', 'telefono'] },
          { model: User, as: 'cliente', attributes: ['id', 'nombre', 'telefono'] },
          { model: DetallePedido, as: 'detalles' },
        ],
      }),
    ]);

    // Estimación de ganancias del día (total - comisión plataforma)
    const totalBrutoHoy = await Pedido.sum('costoEnvio', {
      where: { deliveryId, estado: 'entregado', horaEntregaReal: { [Op.gte]: hoy } },
    });

    res.json({
      enLinea: req.user.enLinea,
      rating: req.user.rating,
      entregasHoy,
      entregasTotal,
      gananciasHoy: parseFloat(totalBrutoHoy || 0).toFixed(2),
      entregaActiva,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
};

// Dashboard comerciante propio (sin comercioId en params, usa auth)
const comercianteDashboardPropio = async (req, res) => {
  try {
    const comercio = await Comercio.findOne({ where: { usuarioId: req.user.id } });
    if (!comercio) return res.status(404).json({ error: 'No tenés un comercio registrado' });

    req.params.comercioId = comercio.id;
    return comercianteDashboardConSemana(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
};

// Agrega campos de semana al dashboard del comerciante
const comercianteDashboardConSemana = async (req, res) => {
  try {
    const { comercioId } = req.params;
    const comercio = await Comercio.findByPk(comercioId);
    if (!comercio) return res.status(404).json({ error: 'Comercio no encontrado' });
    if (req.user.rol !== 'admin' && comercio.usuarioId !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const hoy   = inicioDelDia();
    const semana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const ACTIVOS = ['pendiente', 'preparando', 'listo', 'en_entrega'];

    const [pedidosHoy, ingresosHoy, pedidosPendientes, pedidosActivos, pedidosSemana, ventasSemana, canceladosSemana] = await Promise.all([
      Pedido.count({ where: { comercioId: comercio.id, estado: 'entregado', horaEntregaReal: { [Op.gte]: hoy } } }),
      Pedido.sum('total', { where: { comercioId: comercio.id, estado: 'entregado', horaEntregaReal: { [Op.gte]: hoy } } }),
      Pedido.count({ where: { comercioId: comercio.id, estado: 'pendiente' } }),
      Pedido.count({ where: { comercioId: comercio.id, estado: { [Op.in]: ACTIVOS } } }),
      Pedido.count({ where: { comercioId: comercio.id, estado: 'entregado', createdAt: { [Op.gte]: semana } } }),
      Pedido.sum('total', { where: { comercioId: comercio.id, estado: 'entregado', createdAt: { [Op.gte]: semana } } }),
      Pedido.count({ where: { comercioId: comercio.id, estado: 'cancelado', createdAt: { [Op.gte]: semana } } }),
    ]);

    res.json({
      comercio: comercio.toJSON(),
      pedidosHoy,
      ventasHoy: parseFloat(ingresosHoy || 0).toFixed(2),
      pedidosPendientes,
      pedidosActivos,
      pedidosSemana,
      ventasSemana: parseFloat(ventasSemana || 0).toFixed(2),
      canceladosSemana,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
};

module.exports = {
  adminKPIs,
  transaccionesPorHora,
  comerciosMasPopulares,
  deliveryTopRanking,
  ingresosPorPeriodo,
  comercianteDashboard,
  comercianteDashboardPropio,
  comercianteDashboardConSemana,
  deliveryDashboard,
};
