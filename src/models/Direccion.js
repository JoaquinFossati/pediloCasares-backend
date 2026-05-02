const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Direccion = sequelize.define('Direccion', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  usuarioId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Casa',
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
  principal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'direcciones',
  timestamps: true,
  indexes: [
    { fields: ['usuarioId'] },
  ],
});

module.exports = Direccion;
