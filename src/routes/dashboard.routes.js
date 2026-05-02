const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Admin
router.get('/admin/kpis', authenticate, authorize('admin'), dashboardController.adminKPIs);
router.get('/admin/transacciones-por-hora', authenticate, authorize('admin'), dashboardController.transaccionesPorHora);
router.get('/admin/comercios-populares', authenticate, authorize('admin'), dashboardController.comerciosMasPopulares);
router.get('/admin/ranking-delivery', authenticate, authorize('admin'), dashboardController.deliveryTopRanking);
router.get('/admin/ingresos', authenticate, authorize('admin'), dashboardController.ingresosPorPeriodo);

// Comerciante (sin param = usa comercio propio del usuario autenticado)
router.get('/comercio', authenticate, authorize('comerciante'), dashboardController.comercianteDashboardPropio);
router.get('/comercio/:comercioId', authenticate, authorize('comerciante', 'admin'), dashboardController.comercianteDashboardConSemana);

// Delivery
router.get('/delivery', authenticate, authorize('delivery'), dashboardController.deliveryDashboard);

module.exports = router;
