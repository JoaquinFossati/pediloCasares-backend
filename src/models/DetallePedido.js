const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DetallePedido = sequelize.define('DetallePedido', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  pedidoId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  productoId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.DECIMAL(5, 1),
    allowNull: false,
    validate: { min: 0.5 },
  },
  precioUnitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  nombreProducto: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tiempoPreparacion: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  variantes: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'detalles_pedido',
  timestamps: true,
  indexes: [
    { fields: ['pedidoId'] },
  ],
});

module.exports = DetallePedido;
