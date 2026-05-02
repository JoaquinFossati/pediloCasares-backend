const User = require('./User');
const Comercio = require('./Comercio');
const Categoria = require('./Categoria');
const Producto = require('./Producto');
const VarianteProducto = require('./VarianteProducto');
const Pedido = require('./Pedido');
const DetallePedido = require('./DetallePedido');
const Direccion = require('./Direccion');
const Transaccion = require('./Transaccion');
const Mensaje = require('./Mensaje');
const MovimientoWallet = require('./MovimientoWallet');
const Notificacion = require('./Notificacion');

// User → Comercio
User.hasMany(Comercio, { foreignKey: 'usuarioId', as: 'comercios' });
Comercio.belongsTo(User, { foreignKey: 'usuarioId', as: 'propietario' });

// Comercio → Categoria
Comercio.hasMany(Categoria, { foreignKey: 'comercioId', as: 'categorias', onDelete: 'CASCADE' });
Categoria.belongsTo(Comercio, { foreignKey: 'comercioId', as: 'comercio' });

// Comercio → Producto
Comercio.hasMany(Producto, { foreignKey: 'comercioId', as: 'productos', onDelete: 'CASCADE' });
Producto.belongsTo(Comercio, { foreignKey: 'comercioId', as: 'comercio' });

// Categoria → Producto
Categoria.hasMany(Producto, { foreignKey: 'categoriaId', as: 'productos' });
Producto.belongsTo(Categoria, { foreignKey: 'categoriaId', as: 'categoria' });

// Producto → VarianteProducto
Producto.hasMany(VarianteProducto, { foreignKey: 'productoId', as: 'variantes', onDelete: 'CASCADE' });
VarianteProducto.belongsTo(Producto, { foreignKey: 'productoId', as: 'producto' });

// Pedido → User (cliente, delivery)
User.hasMany(Pedido, { foreignKey: 'clienteId', as: 'pedidosComoCliente' });
Pedido.belongsTo(User, { foreignKey: 'clienteId', as: 'cliente' });

User.hasMany(Pedido, { foreignKey: 'deliveryId', as: 'pedidosComoDelivery' });
Pedido.belongsTo(User, { foreignKey: 'deliveryId', as: 'delivery' });

// Pedido → Comercio
Comercio.hasMany(Pedido, { foreignKey: 'comercioId', as: 'pedidos' });
Pedido.belongsTo(Comercio, { foreignKey: 'comercioId', as: 'comercio' });

// Pedido → DetallePedido
Pedido.hasMany(DetallePedido, { foreignKey: 'pedidoId', as: 'detalles', onDelete: 'CASCADE' });
DetallePedido.belongsTo(Pedido, { foreignKey: 'pedidoId', as: 'pedido' });

// DetallePedido → Producto
Producto.hasMany(DetallePedido, { foreignKey: 'productoId', as: 'detallesPedido' });
DetallePedido.belongsTo(Producto, { foreignKey: 'productoId', as: 'producto' });

// User → Direccion
User.hasMany(Direccion, { foreignKey: 'usuarioId', as: 'direcciones', onDelete: 'CASCADE' });
Direccion.belongsTo(User, { foreignKey: 'usuarioId', as: 'usuario' });

// Transaccion → Pedido / User
Pedido.hasMany(Transaccion, { foreignKey: 'pedidoId', as: 'transacciones' });
Transaccion.belongsTo(Pedido, { foreignKey: 'pedidoId', as: 'pedido' });

User.hasMany(Transaccion, { foreignKey: 'usuarioId', as: 'transacciones' });
Transaccion.belongsTo(User, { foreignKey: 'usuarioId', as: 'usuario' });

// Mensaje → Pedido / User
Pedido.hasMany(Mensaje, { foreignKey: 'pedidoId', as: 'mensajes', onDelete: 'CASCADE' });
Mensaje.belongsTo(Pedido, { foreignKey: 'pedidoId', as: 'pedido' });

User.hasMany(Mensaje, { foreignKey: 'remitenteId', as: 'mensajesEnviados' });
Mensaje.belongsTo(User, { foreignKey: 'remitenteId', as: 'remitente' });

// MovimientoWallet → User / Pedido
User.hasMany(MovimientoWallet, { foreignKey: 'usuarioId', as: 'movimientosWallet' });
MovimientoWallet.belongsTo(User, { foreignKey: 'usuarioId', as: 'usuario' });

Pedido.hasMany(MovimientoWallet, { foreignKey: 'pedidoId', as: 'movimientosWallet' });
MovimientoWallet.belongsTo(Pedido, { foreignKey: 'pedidoId', as: 'pedido' });

// Notificacion → User
User.hasMany(Notificacion, { foreignKey: 'usuarioId', as: 'notificaciones', onDelete: 'CASCADE' });
Notificacion.belongsTo(User, { foreignKey: 'usuarioId', as: 'usuario' });

module.exports = { User, Comercio, Categoria, Producto, VarianteProducto, Pedido, DetallePedido, Direccion, Transaccion, Mensaje, MovimientoWallet, Notificacion };
