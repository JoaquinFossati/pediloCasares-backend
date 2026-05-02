const { Comercio, Categoria, Producto, VarianteProducto, User, Pedido } = require('../models');
const { Op } = require('sequelize');

const listar = async (req, res) => {
  try {
    const { todos } = req.query;
    const where = todos === 'true' ? {} : { estado: ['abierto', 'cerrado'] };
    const comercios = await Comercio.findAll({
      where,
      include: [{ model: User, as: 'propietario', attributes: ['id', 'nombre', 'email'] }],
      order: [['rating', 'DESC']],
    });
    res.json(comercios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener comercios' });
  }
};

const obtener = async (req, res) => {
  try {
    const comercio = await Comercio.findByPk(req.params.id, {
      include: [
        { model: User, as: 'propietario', attributes: ['id', 'nombre', 'email'] },
        {
          model: Categoria, as: 'categorias',
          include: [{
            model: Producto, as: 'productos', where: { disponible: true }, required: false,
            include: [{ model: VarianteProducto, as: 'variantes', attributes: ['id', 'nombre', 'orden'], order: [['orden', 'ASC']] }],
          }],
          order: [['orden', 'ASC']],
        },
      ],
    });
    if (!comercio) return res.status(404).json({ error: 'Comercio no encontrado' });
    res.json(comercio);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener comercio' });
  }
};

const crear = async (req, res) => {
  try {
    const { nombre, descripcion, direccion, latitud, longitud, telefono,
            horarioApertura, horarioCierre, comisionPorcentaje, zonaCobertura } = req.body;

    const usuarioId = req.user.rol === 'admin' ? (req.body.usuarioId || req.user.id) : req.user.id;

    const comercio = await Comercio.create({
      nombre, descripcion, direccion, latitud, longitud, telefono,
      horarioApertura, horarioCierre, comisionPorcentaje, zonaCobertura, usuarioId,
    });
    res.status(201).json(comercio);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear comercio' });
  }
};

const actualizar = async (req, res) => {
  try {
    const comercio = await Comercio.findByPk(req.params.id);
    if (!comercio) return res.status(404).json({ error: 'Comercio no encontrado' });

    if (req.user.rol !== 'admin' && comercio.usuarioId !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso para editar este comercio' });
    }

    const camposComunes = ['nombre', 'descripcion', 'foto', 'logo', 'tipo', 'direccion', 'latitud', 'longitud',
                           'telefono', 'horarioApertura', 'horarioCierre',
                           'colorFondo', 'colorTexto', 'colorAccento'];
    const camposSoloAdmin = ['costoEnvio', 'comisionPorcentaje', 'zonaCobertura'];
    const campos = req.user.rol === 'admin'
      ? [...camposComunes, ...camposSoloAdmin]
      : camposComunes;
    campos.forEach(c => { if (req.body[c] !== undefined) comercio[c] = req.body[c]; });

    await comercio.save();
    res.json(comercio);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar comercio' });
  }
};

const cambiarEstado = async (req, res) => {
  try {
    const comercio = await Comercio.findByPk(req.params.id);
    if (!comercio) return res.status(404).json({ error: 'Comercio no encontrado' });

    if (req.user.rol !== 'admin' && comercio.usuarioId !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const { estado } = req.body;
    const estadosValidos = req.user.rol === 'admin'
      ? ['abierto', 'cerrado', 'inactivo']
      : ['abierto', 'cerrado'];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    await comercio.update({ estado });
    res.json({ id: comercio.id, estado: comercio.estado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};

const eliminar = async (req, res) => {
  try {
    const comercio = await Comercio.findByPk(req.params.id);
    if (!comercio) return res.status(404).json({ error: 'Comercio no encontrado' });

    await comercio.update({ estado: 'inactivo' });
    res.json({ message: 'Comercio desactivado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar comercio' });
  }
};

// Endpoint público: cantidad de comercios abiertos, deliverys en línea y clientes activos
const stats = async (req, res) => {
  try {
    const hace15min = new Date(Date.now() - 15 * 60 * 1000);
    const [comerciosAbiertos, deliverysEnLinea, clientesActivos] = await Promise.all([
      Comercio.count({ where: { estado: 'abierto' } }),
      User.count({ where: { rol: 'delivery', enLinea: true } }),
      // Clientes que hicieron algún request en los últimos 15 minutos
      User.count({ where: { rol: 'cliente', ultimaActividad: { [Op.gte]: hace15min } } }),
    ]);
    res.json({ comerciosAbiertos, deliverysEnLinea, clientesActivos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, eliminar, stats };
