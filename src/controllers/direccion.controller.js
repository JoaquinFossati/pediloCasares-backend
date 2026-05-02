const { Direccion } = require('../models');

const listar = async (req, res) => {
  try {
    const direcciones = await Direccion.findAll({
      where: { usuarioId: req.user.id },
      order: [['principal', 'DESC'], ['createdAt', 'ASC']],
    });
    res.json(direcciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener direcciones' });
  }
};

const crear = async (req, res) => {
  try {
    const { nombre, direccion, latitud, longitud, principal } = req.body;
    const usuarioId = req.user.id;

    // Si se marca como principal, desmarcar las demás
    if (principal) {
      await Direccion.update({ principal: false }, { where: { usuarioId } });
    }

    // Si es la primera, hacerla principal automáticamente
    const cantidad = await Direccion.count({ where: { usuarioId } });
    const nuevaDireccion = await Direccion.create({
      usuarioId, nombre, direccion, latitud, longitud,
      principal: principal || cantidad === 0,
    });
    res.status(201).json(nuevaDireccion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear dirección' });
  }
};

const actualizar = async (req, res) => {
  try {
    const dir = await Direccion.findByPk(req.params.id);
    if (!dir) return res.status(404).json({ error: 'Dirección no encontrada' });
    if (dir.usuarioId !== req.user.id) return res.status(403).json({ error: 'Sin permiso' });

    const { nombre, direccion, latitud, longitud } = req.body;
    if (nombre !== undefined) dir.nombre = nombre;
    if (direccion !== undefined) dir.direccion = direccion;
    if (latitud !== undefined) dir.latitud = latitud;
    if (longitud !== undefined) dir.longitud = longitud;
    await dir.save();
    res.json(dir);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar dirección' });
  }
};

const eliminar = async (req, res) => {
  try {
    const dir = await Direccion.findByPk(req.params.id);
    if (!dir) return res.status(404).json({ error: 'Dirección no encontrada' });
    if (dir.usuarioId !== req.user.id) return res.status(403).json({ error: 'Sin permiso' });

    const eraPrincipal = dir.principal;
    await dir.destroy();

    // Si era la principal, asignar la primera que quede
    if (eraPrincipal) {
      const siguiente = await Direccion.findOne({ where: { usuarioId: req.user.id }, order: [['createdAt', 'ASC']] });
      if (siguiente) await siguiente.update({ principal: true });
    }

    res.json({ message: 'Dirección eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar dirección' });
  }
};

const setPrincipal = async (req, res) => {
  try {
    const dir = await Direccion.findByPk(req.params.id);
    if (!dir) return res.status(404).json({ error: 'Dirección no encontrada' });
    if (dir.usuarioId !== req.user.id) return res.status(403).json({ error: 'Sin permiso' });

    await Direccion.update({ principal: false }, { where: { usuarioId: req.user.id } });
    await dir.update({ principal: true });
    res.json(dir);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al establecer dirección principal' });
  }
};

module.exports = { listar, crear, actualizar, eliminar, setPrincipal };
