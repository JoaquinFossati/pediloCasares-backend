const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DeliveryCS API',
      version: '1.0.0',
      description: 'API REST para DeliveryCS — App de delivery local para Carlos Casares, Buenos Aires',
      contact: { name: 'DeliveryCS', email: 'admin@deliverycs.com' },
    },
    servers: [
      { url: 'http://localhost:3000/api', description: 'Desarrollo local' },
      { url: 'https://api.deliverycs.com/api', description: 'Producción' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresá el token JWT obtenido en /auth/login',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id:        { type: 'string', format: 'uuid' },
            email:     { type: 'string', format: 'email' },
            nombre:    { type: 'string' },
            telefono:  { type: 'string' },
            rol:       { type: 'string', enum: ['admin', 'comerciante', 'delivery', 'cliente'] },
            foto:      { type: 'string', nullable: true },
            estado:    { type: 'boolean' },
            rating:    { type: 'number' },
            enLinea:   { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Comercio: {
          type: 'object',
          properties: {
            id:           { type: 'string', format: 'uuid' },
            nombre:       { type: 'string' },
            descripcion:  { type: 'string' },
            direccion:    { type: 'string' },
            latitud:      { type: 'number' },
            longitud:     { type: 'number' },
            estado:       { type: 'string', enum: ['abierto', 'cerrado', 'inactivo'] },
            rating:       { type: 'number' },
            horarioApertura: { type: 'string' },
            horarioCierre:   { type: 'string' },
          },
        },
        Producto: {
          type: 'object',
          properties: {
            id:          { type: 'string', format: 'uuid' },
            nombre:      { type: 'string' },
            descripcion: { type: 'string' },
            precio:      { type: 'number' },
            foto:        { type: 'string', nullable: true },
            disponible:  { type: 'boolean' },
            categoriaId: { type: 'string', format: 'uuid', nullable: true },
          },
        },
        Pedido: {
          type: 'object',
          properties: {
            id:              { type: 'string', format: 'uuid' },
            numeroPedido:    { type: 'string', example: 'CS-2026-12345' },
            estado:          { type: 'string', enum: ['pendiente', 'preparando', 'listo', 'en_entrega', 'entregado', 'cancelado'] },
            subtotal:        { type: 'number' },
            costoEnvio:      { type: 'number' },
            total:           { type: 'number' },
            metodoPago:      { type: 'string', enum: ['efectivo', 'transferencia'] },
            direccionEntrega: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth',         description: 'Autenticación y sesiones' },
      { name: 'Usuarios',     description: 'Gestión de perfiles y admin' },
      { name: 'Comercios',    description: 'CRUD de comercios' },
      { name: 'Productos',    description: 'CRUD de productos' },
      { name: 'Categorías',   description: 'Categorías de productos' },
      { name: 'Pedidos',      description: 'Flujo completo de pedidos' },
      { name: 'Chat',         description: 'Historial de mensajes' },
      { name: 'Dashboard',    description: 'KPIs y analítica por rol' },
      { name: 'Transacciones', description: 'Pagos y reembolsos' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
