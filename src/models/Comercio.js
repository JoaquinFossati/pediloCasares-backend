const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comercio = sequelize.define('Comercio', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  foto: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  logo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  direccion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  latitud: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  longitud: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  usuarioId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('abierto', 'cerrado', 'inactivo'),
    defaultValue: 'cerrado',
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  numCalificaciones: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  horarioApertura: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  horarioCierre: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  tipo: {
    type: DataTypes.ENUM('Comida', 'Bebidas', 'Farmacia', 'Supermercado', 'Otros'),
    defaultValue: 'Otros',
    allowNull: false,
  },
  costoEnvio: {
    type: DataTypes.FLOAT,
    defaultValue: 50,
  },
  comisionPorcentaje: {
    type: DataTypes.FLOAT,
    defaultValue: 20,
  },
  zonaCobertura: {
    type: DataTypes.INTEGER,
    defaultValue: 5000,
  },
  // ── Personalización visual del card ─────────────────────────────────────
  colorFondo:   { type: DataTypes.STRING(9), allowNull: true },  // ej: "#FFFFFF"
  colorTexto:   { type: DataTypes.STRING(9), allowNull: true },  // ej: "#212121"
  colorAccento: { type: DataTypes.STRING(9), allowNull: true },  // ej: "#2D6CDF"
}, {
  tableName: 'comercios',
  timestamps: true,
  indexes: [
    { fields: ['usuarioId'] },
    { fields: ['estado'] },
  ],
});

module.exports = Comercio;
