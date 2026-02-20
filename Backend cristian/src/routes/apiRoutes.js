/**
 * Rutas Privadas (API) - Requieren autenticación
 * 
 * CITAS:
 *   GET    /api/appointments            - Listar citas (owner: todas, pro: las suyas)
 *   GET    /api/appointments/:id        - Detalle de cita
 *   PATCH  /api/appointments/:id/cancel - Cancelar cita
 *   PATCH  /api/appointments/:id/status - Cambiar estado (solo owner)
 * 
 * PROFESIONALES (solo owner):
 *   GET    /api/professionals           - Listar
 *   POST   /api/professionals           - Crear
 *   PATCH  /api/professionals/:id       - Actualizar
 * 
 * SERVICIOS (solo owner):
 *   GET    /api/services                - Listar
 *   POST   /api/services                - Crear
 *   PATCH  /api/services/:id            - Actualizar
 * 
 * ASIGNACIONES (solo owner):
 *   POST   /api/professional-services          - Asignar servicio a profesional
 *   DELETE /api/professional-services/:pid/:sid - Desasignar
 * 
 * HORARIOS (solo owner):
 *   GET    /api/business-hours                       - Horarios del negocio
 *   PUT    /api/business-hours                       - Establecer horarios
 *   GET    /api/professional-hours/:professional_id  - Horarios de un profesional
 *   PUT    /api/professional-hours/:professional_id  - Establecer horarios profesional
 * 
 * BLOQUEOS (solo owner):
 *   GET    /api/time-blocks         - Listar
 *   POST   /api/time-blocks         - Crear
 *   DELETE /api/time-blocks/:id     - Eliminar
 * 
 * CLIENTES (solo owner):
 *   GET    /api/clients             - Listar
 *   GET    /api/clients/:id/history - Historial del cliente
 * 
 * DASHBOARD (solo owner):
 *   GET    /api/dashboard           - Estadísticas
 * 
 * CONFIGURACIÓN (solo owner):
 *   GET    /api/settings            - Obtener config
 *   PUT    /api/settings            - Actualizar config
 */
const express = require('express');
const router = express.Router();
const { authenticate, requireOwner, requireAuth } = require('../middleware/auth');
const {
    listAppointments, getAppointment, cancelAppointment, updateAppointmentStatus
} = require('../controllers/appointmentsController');
const {
    listProfessionals, createProfessional, updateProfessional,
    listServices, createService, updateService,
    assignServiceToProfessional, removeServiceFromProfessional,
    getBusinessHours, setBusinessHours,
    getProfessionalHours, setProfessionalHours,
    listTimeBlocks, createTimeBlock, deleteTimeBlock,
    listClients, getClientHistory,
    getDashboard,
    getSettings, updateSettings
} = require('../controllers/managementController');

// Todas las rutas requieren autenticación
router.use(authenticate);

// ---- CITAS (owner ve todo, professional ve las suyas) ----
router.get('/appointments', requireAuth, listAppointments);
router.get('/appointments/:id', requireAuth, getAppointment);
router.patch('/appointments/:id/cancel', requireAuth, cancelAppointment);
router.patch('/appointments/:id/status', requireOwner, updateAppointmentStatus);

// ---- PROFESIONALES (solo owner) ----
router.get('/professionals', requireOwner, listProfessionals);
router.post('/professionals', requireOwner, createProfessional);
router.patch('/professionals/:id', requireOwner, updateProfessional);

// ---- SERVICIOS (solo owner) ----
router.get('/services', requireOwner, listServices);
router.post('/services', requireOwner, createService);
router.patch('/services/:id', requireOwner, updateService);

// ---- ASIGNACIONES PROFESIONAL-SERVICIO (solo owner) ----
router.post('/professional-services', requireOwner, assignServiceToProfessional);
router.delete('/professional-services/:professional_id/:service_id', requireOwner, removeServiceFromProfessional);

// ---- HORARIOS (solo owner) ----
router.get('/business-hours', requireOwner, getBusinessHours);
router.put('/business-hours', requireOwner, setBusinessHours);
router.get('/professional-hours/:professional_id', requireOwner, getProfessionalHours);
router.put('/professional-hours/:professional_id', requireOwner, setProfessionalHours);

// ---- BLOQUEOS DE TIEMPO (solo owner) ----
router.get('/time-blocks', requireOwner, listTimeBlocks);
router.post('/time-blocks', requireOwner, createTimeBlock);
router.delete('/time-blocks/:id', requireOwner, deleteTimeBlock);

// ---- CLIENTES (solo owner) ----
router.get('/clients', requireOwner, listClients);
router.get('/clients/:id/history', requireOwner, getClientHistory);

// ---- DASHBOARD (solo owner) ----
router.get('/dashboard', requireOwner, getDashboard);

// ---- CONFIGURACIÓN (solo owner) ----
router.get('/settings', requireOwner, getSettings);
router.put('/settings', requireOwner, updateSettings);

module.exports = router;
