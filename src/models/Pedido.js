const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pedido = sequelize.define('Pedido', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  clienteId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  comercioId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  deliveryId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('programado', 'pendiente', 'preparando', 'listo', 'en_entrega', 'entregado', 'cancelado'),
    defaultValue: 'pendiente',
  },
  programadoPara: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  direccionEntrega: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  latitudEntrega: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  longitudEntrega: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  costoEnvio: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  descuento: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  metodoPago: {
    type: DataTypes.ENUM('efectivo', 'transferencia'),
    allowNull: false,
  },
  notas: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  numeroPedido: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  horaEntregaEstimada: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  horaEntregaReal: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  calificacionComercio: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 },
  },
  calificacionDelivery: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 5 },
  },
  comentarioCliente: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  expiraEn: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  codigoRetiro: {
    type: DataTypes.STRING(4),
    allowNull: true,
  },
  codigoEntrega: {
    type: DataTypes.STRING(4),
    allowNull: true,
  },
  motivoCancelacion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tipoEntrega: {
    type: DataTypes.ENUM('delivery', 'retiro'),
    defaultValue: 'delivery',
    allowNull: false,
  },
}, {
  tableName: 'pedidos',
  timestamps: true,
  indexes: [
    { fields: ['clienteId'] },
    { fields: ['comercioId'] },
    { fields: ['deliveryId'] },
    { fields: ['estado'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = Pedido;
