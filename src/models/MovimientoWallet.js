const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MovimientoWallet = sequelize.define('MovimientoWallet', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  usuarioId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  pedidoId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  tipo: {
    type: DataTypes.ENUM('credito', 'debito'),
    allowNull: false,
  },
  concepto: {
    type: DataTypes.ENUM(
      'venta',           // Comerciante cobra su parte de una venta
      'comision',        // Admin cobra comisión
      'delivery',        // Delivery cobra tarifa de envío
      'efectivo_cobrado',// Delivery recibe efectivo del cliente (debita su wallet)
      'pago_recibido',   // Admin recibe pago del cliente (transferencia)
      'ajuste',          // Ajuste manual del admin
      'retiro',          // Retiro de fondos
      'deposito'         // Depósito de fondos
    ),
    allowNull: false,
  },
  monto: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  saldoAnterior: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  saldoNuevo: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
}, {
  tableName: 'movimientos_wallet',
  timestamps: true,
  indexes: [
    { fields: ['usuarioId'] },
    { fields: ['pedidoId'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = MovimientoWallet;
