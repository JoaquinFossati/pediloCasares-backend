const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notificacion = sequelize.define('Notificacion', {
  id: {
    type:         DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey:   true,
  },
  usuarioId: {
    type:      DataTypes.UUID,
    allowNull: false,
  },
  tipo: {
    type:         DataTypes.ENUM('pedido', 'wallet', 'sistema', 'usuario'),
    defaultValue: 'sistema',
  },
  emoji: {
    type:         DataTypes.STRING(10),
    allowNull:    false,
    defaultValue: '🔔',
  },
  titulo: {
    type:      DataTypes.STRING(200),
    allowNull: false,
  },
  mensaje: {
    type:      DataTypes.TEXT,
    allowNull: false,
  },
  leido: {
    type:         DataTypes.BOOLEAN,
    allowNull:    false,
    defaultValue: false,
  },
  data: {
    type:      DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName:  'notificaciones',
  updatedAt:  false,
  indexes: [
    { fields: ['usuarioId'] },
    { fields: ['usuarioId', 'leido'] },
  ],
});

module.exports = Notificacion;
