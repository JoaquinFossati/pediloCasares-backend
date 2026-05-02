const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendResetPasswordEmail(email, nombre, codigo) {
  await transporter.sendMail({
    from:    `"Pedílo Casares" <${process.env.SMTP_USER}>`,
    to:      email,
    subject: 'Recuperación de contraseña - Pedílo Casares',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #E53E3E;">Pedílo Casares</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Ingresá este código en la app:</p>
        <div style="text-align: center; margin: 32px 0;">
          <span style="font-size: 48px; font-weight: 900; letter-spacing: 12px; color: #1D4ED8; background: #EFF6FF; padding: 16px 24px; border-radius: 12px;">
            ${codigo}
          </span>
        </div>
        <p style="color: #6B7280; font-size: 14px;">Este código es válido por <strong>1 hora</strong>. Si no solicitaste esto, ignorá este email.</p>
      </div>
    `,
  });
}

module.exports = { sendResetPasswordEmail };
