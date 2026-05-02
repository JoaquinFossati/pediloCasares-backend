const User = require('../models/User');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const { sendResetPasswordEmail } = require('../utils/email');

const register = async (req, res) => {
  try {
    const { email, password, nombre, telefono, rol } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Comerciantes quedan pendientes hasta aprobación del admin
    const pendiente = rol === 'comerciante';
    const user = await User.create({ email, password, nombre, telefono, rol, estado: !pendiente });

    if (pendiente) {
      return res.status(201).json({
        pending: true,
        message: 'Tu solicitud fue recibida. El administrador aprobará tu cuenta pronto.',
      });
    }

    const accessToken = generateAccessToken({ id: user.id, rol: user.rol });
    const refreshToken = generateRefreshToken({ id: user.id });

    await user.update({ refreshToken });

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    if (!user.estado) {
      if (user.rol === 'comerciante') {
        return res.status(403).json({ error: 'Tu cuenta está pendiente de aprobación por el administrador.' });
      }
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const accessToken = generateAccessToken({ id: user.id, rol: user.rol });
    const refreshToken = generateRefreshToken({ id: user.id });

    await user.update({ refreshToken, ultimoLogin: new Date() });

    res.json({ user, accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id);

    if (!user || user.refreshToken !== token || !user.estado) {
      return res.status(401).json({ error: 'Refresh token inválido' });
    }

    const accessToken = generateAccessToken({ id: user.id, rol: user.rol });
    const newRefreshToken = generateRefreshToken({ id: user.id });

    await user.update({ refreshToken: newRefreshToken });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ error: 'Refresh token inválido o expirado' });
  }
};

const logout = async (req, res) => {
  try {
    await req.user.update({ refreshToken: null });
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    // Always respond OK to avoid user enumeration
    if (!user) {
      return res.json({ message: 'Si el email existe, recibirás instrucciones en breve' });
    }

    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await user.update({ resetPasswordToken: codigo, resetPasswordExpires: expires });

    try {
      await sendResetPasswordEmail(user.email, user.nombre, codigo);
    } catch (emailErr) {
      console.error('Error enviando email de recuperación:', emailErr.message);
      return res.status(500).json({ error: 'No se pudo enviar el email. Intentá de nuevo más tarde.' });
    }

    res.json({ message: 'Si el email existe, recibirás instrucciones en breve' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error procesando la solicitud' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 6) {
      return res.status(400).json({ error: 'Token y contraseña (mínimo 6 caracteres) requeridos' });
    }

    const user = await User.findOne({ where: { resetPasswordToken: token } });

    if (!user || user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    await user.update({
      password,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      refreshToken: null,
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al resetear contraseña' });
  }
};

module.exports = { register, login, refreshToken, logout, forgotPassword, resetPassword };
