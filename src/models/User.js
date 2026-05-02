const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rol: {
    type: DataTypes.ENUM('admin', 'comerciante', 'delivery', 'cliente'),
    allowNull: false,
    defaultValue: 'cliente',
  },
  foto: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  estado: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  ultimoLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  numCalificaciones: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  saldo: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    allowNull: false,
  },
  enLinea: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  fcmToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ultimaActividad: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Última vez que el usuario hizo un request autenticado (usado para "clientes en línea")',
  },
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10);
      }
    },
  },
});

User.prototype.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  delete values.refreshToken;
  delete values.resetPasswordToken;
  delete values.resetPasswordExpires;
  return values;
};

module.exports = User;
