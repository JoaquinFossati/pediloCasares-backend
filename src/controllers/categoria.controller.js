const { Categoria, Comercio, Producto } = require('../models');

const listar = async (req, res) => {
  try {
    const { comercioId } = req.params;
    const categorias = await Categoria.findAll({
      where: { comercioId },
      include: [{ model: Producto, as: 'productos', where: { disponible: true }, required: false }],
      order: [['orden', 'ASC']],
    });
    res.json(categorias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

const crear = async (req, res) => {
  try {
    const { comercioId } = req.params;
    const { nombre, orden } = req.body;

    const comercio = await Comercio.findByPk(comercioId);
    if (!comercio) return res.status(404).json({ error: 'Comercio no encontrado' });

    if (req.user.rol !== 'admin' && comercio.usuarioId !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const categoria = await Categoria.create({ comercioId, nombre, orden });
    res.status(201).json(categoria);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

const actualizar = async (req, res) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id, {
      include: [{ model: Comercio, as: 'comercio' }],
    });
    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });

    if (req.user.rol !== 'admin' && categoria.comercio.usuarioId !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const { nombre, orden } = req.body;
    if (nombre !== undefined) categoria.nombre = nombre;
    if (orden !== undefined) categoria.orden = orden;

    await categoria.save();
    res.json(categoria);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
};

const eliminar = async (req, res) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id, {
      include: [{ model: Comercio, as: 'comercio' }],
    });
    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });

    if (req.user.rol !== 'admin' && categoria.comercio.usuarioId !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    await categoria.destroy();
    res.json({ message: 'Categoría eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};

module.exports = { listar, crear, actualizar, eliminar };
