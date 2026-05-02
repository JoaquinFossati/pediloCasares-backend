const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaccion = sequelize.define('Transaccion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  pedidoId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  usuarioId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  monto: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  metodoPago: {
    type: DataTypes.ENUM('efectivo', 'transferencia'),
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'completada', 'fallida', 'reembolsada'),
    defaultValue: 'pendiente',
  },
  referenciaMP: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  fechaTransaccion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'transacciones',
  timestamps: true,
  indexes: [
    { fields: ['pedidoId'] },
    { fields: ['usuarioId'] },
    { fields: ['estado'] },
    { fields: ['fechaTransaccion'] },
  ],
});

module.exports = Transaccion;
