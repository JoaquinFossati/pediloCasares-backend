const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Mensaje = sequelize.define('Mensaje', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  pedidoId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  remitenteId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  foto: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tipo: {
    type: DataTypes.ENUM('texto', 'foto', 'ubicacion', 'sistema'),
    defaultValue: 'texto',
  },
  leido: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  canal: {
    type: DataTypes.ENUM('cliente_comercio', 'comercio_delivery', 'delivery_cliente'),
    defaultValue: 'cliente_comercio',
  },
}, {
  tableName: 'mensajes',
  timestamps: true,
  indexes: [
    { fields: ['pedidoId'] },
    { fields: ['remitenteId'] },
  ],
});

module.exports = Mensaje;
