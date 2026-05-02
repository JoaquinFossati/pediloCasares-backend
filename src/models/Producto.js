const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Producto = sequelize.define('Producto', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  comercioId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  categoriaId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  foto: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  disponible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  orden: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  permiteMedia: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  tiempoPreparacion: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tieneVariantes: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  unidadesMaximas: {
    type:      DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    comment:   'Unidades totales a distribuir entre variantes (ej: 12 para una docena)',
  },
}, {
  tableName: 'productos',
  timestamps: true,
  indexes: [
    { fields: ['comercioId'] },
    { fields: ['disponible'] },
  ],
});

module.exports = Producto;
