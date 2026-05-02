const { Producto, Comercio, Categoria, VarianteProducto } = require('../models');

const VARIANTES_INCLUDE = { model: VarianteProducto, as: 'variantes', attributes: ['id', 'nombre', 'orden'], order: [['orden', 'ASC']] };

const listar = async (req, res) => {
  try {
    const { comercioId, categoriaId, disponible } = req.query;
    const where = {};
    if (comercioId) where.comercioId = comercioId;
    if (categoriaId) where.categoriaId = categoriaId;
    if (disponible !== undefined) where.disponible = disponible === 'true';

    const productos = await Producto.findAll({
      where,
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
        VARIANTES_INCLUDE,
      ],
      order: [['orden', 'ASC'], ['nombre', 'ASC']],
    });
    res.json(productos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

const obtener = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [
        { model: Categoria, as: 'categoria' },
        VARIANTES_INCLUDE,
      ],
    });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

const crear = async (req, res) => {
  try {
    const { comercioId, categoriaId, nombre, descripcion, precio, foto, disponible, orden,
            permiteMedia, tiempoPreparacion, tieneVariantes, variantes } = req.body;

    const comercio = await Comercio.findByPk(comercioId);
    if (!comercio) return res.status(404).json({ error: 'Comercio no encontrado' });

    if (req.user.rol !== 'admin' && comercio.usuarioId !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso para agregar productos a este comercio' });
    }

    if (categoriaId) {
      const cat = await Categoria.findByPk(categoriaId);
      if (!cat || cat.comercioId !== comercioId) {
        return res.status(400).json({ error: 'Categoría inválida para este comercio' });
      }
    }

    const { unidadesMaximas } = req.body;
    const producto = await Producto.create({
      comercioId, categoriaId, nombre, descripcion, precio, foto, disponible, orden,
      permiteMedia, tiempoPreparacion: tiempoPreparacion || null,
      tieneVariantes: tieneVariantes === true,
      unidadesMaximas: tieneVariantes && unidadesMaximas ? parseInt(unidadesMaximas, 10) : null,
    });

    // Crear variantes si aplica
    if (tieneVariantes && Array.isArray(variantes) && variantes.length > 0) {
      await VarianteProducto.bulkCreate(
        variantes.map((v, i) => ({ productoId: producto.id, nombre: v.nombre, orden: i }))
      );
    }

    const productoConVariantes = await Producto.findByPk(producto.id, {
      include: [VARIANTES_INCLUDE],
    });
    res.status(201).json(productoConVariantes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

const actualizar = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [{ model: Comercio, as: 'comercio' }],
    });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    if (req.user.rol !== 'admin' && producto.comercio.usuarioId !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const campos = ['nombre', 'descripcion', 'precio', 'foto', 'disponible', 'orden',
                    'categoriaId', 'permiteMedia', 'tiempoPreparacion', 'tieneVariantes', 'unidadesMaximas'];
    campos.forEach(c => { if (req.body[c] !== undefined) producto[c] = req.body[c]; });

    await producto.save();
    res.json(producto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

const eliminar = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [{ model: Comercio, as: 'comercio' }],
    });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    if (req.user.rol !== 'admin' && producto.comercio.usuarioId !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    await producto.destroy();
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

const miComercio = async (req, res) => {
  try {
    const comercio = await Comercio.findOne({ where: { usuarioId: req.user.id } });
    if (!comercio) return res.status(404).json({ error: 'Comercio no encontrado' });

    const productos = await Producto.findAll({
      where: { comercioId: comercio.id },
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
        VARIANTES_INCLUDE,
      ],
      order: [['orden', 'ASC'], ['nombre', 'ASC']],
    });
    res.json(productos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// Reemplaza todas las variantes de un producto
const actualizarVariantes = async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [{ model: Comercio, as: 'comercio' }],
    });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    if (req.user.rol !== 'admin' && producto.comercio.usuarioId !== req.user.id) {
      return res.status(403).json({ error: 'Sin permiso' });
    }

    const { variantes = [] } = req.body;
    await VarianteProducto.destroy({ where: { productoId: producto.id } });

    if (variantes.length > 0) {
      await VarianteProducto.bulkCreate(
        variantes.map((v, i) => ({ productoId: producto.id, nombre: v.nombre, orden: i }))
      );
    }

    const result = await VarianteProducto.findAll({
      where: { productoId: producto.id },
      order: [['orden', 'ASC']],
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar variantes' });
  }
};

module.exports = { listar, obtener, miComercio, crear, actualizar, eliminar, actualizarVariantes };
