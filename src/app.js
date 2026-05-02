require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const sequelize = require('./config/database');
require('./models');
const routes = require('./routes');
const { iniciarSocket } = require('./socket');
const { setIO } = require('./config/socketInstance');
const { iniciarJob: iniciarCancelacion } = require('./jobs/cancelarPedidosVencidos');
const { iniciarJob: iniciarEncargues }   = require('./jobs/activarEncargues');

const app = express();
const server = http.createServer(app);

// Trust Railway's reverse proxy (needed for HTTPS detection and correct IPs)
app.set('trust proxy', 1);

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
// Archivos estáticos (fotos de productos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas solicitudes. Intentá de nuevo en un minuto.' },
});
app.use(limiter);

// Parsing & logging
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Swagger docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'DeliveryCS API Docs',
}));
app.get('/docs.json', (req, res) => res.json(swaggerSpec));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

const PORT = process.env.PORT || 3000;

sequelize
  .authenticate()
  .then(() => {
    console.log('Conexión a PostgreSQL exitosa.');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log('Tablas sincronizadas.');
    const io = iniciarSocket(server);
    app.set('io', io); // disponible en controllers vía req.app.get('io')
    setIO(io);         // disponible en servicios vía getIO()
    server.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT} [${process.env.NODE_ENV}]`);
      console.log(`Socket.io activo en ws://localhost:${PORT}`);
      iniciarCancelacion(io);
      iniciarEncargues(io);
    });
  })
  .catch((err) => {
    console.error('Error conectando a la base de datos:', err.message);
    process.exit(1);
  });

module.exports = { app, server };
