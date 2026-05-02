const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VarianteProducto = sequelize.define('VarianteProducto', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productoId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  orden: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'variantes_producto',
  timestamps: false,
  indexes: [{ fields: ['productoId'] }],
});

module.exports = VarianteProducto;
