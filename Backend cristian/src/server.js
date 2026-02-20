/**
 * =====================================================
 * BARBERÍA CRISTIAN - SERVIDOR BACKEND
 * =====================================================
 * 
 * API REST para gestión de la barbería con dos roles:
 * - Owner (Dueño): Acceso completo a todo el sistema
 * - Professional (Profesional): Solo gestiona sus citas
 * 
 * Rutas:
 * - /public/*  → Endpoints públicos (disponibilidad, reservas)
 * - /auth/*    → Autenticación (login, me)
 * - /api/*     → Endpoints privados (gestión)
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const publicRoutes = require('./routes/publicRoutes');
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// =====================================================
// MIDDLEWARE GLOBALES
// =====================================================

// Seguridad (permitir inline para el panel)
app.use(helmet({
    contentSecurityPolicy: false
}));

// Logging
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// CORS
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',');
app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parser JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    message: {
        error: {
            code: 'RATE_LIMIT',
            message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.'
        }
    }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        error: {
            code: 'RATE_LIMIT',
            message: 'Demasiados intentos de login. Intenta de nuevo más tarde.'
        }
    }
});

// =====================================================
// ARCHIVOS ESTÁTICOS (Panel de Gestión)
// =====================================================
app.use(express.static(path.join(__dirname, '..', 'public')));

// =====================================================
// RUTAS API
// =====================================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Barbería Cristian Backend',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// Rutas públicas (clientes)
app.use('/public', publicLimiter, publicRoutes);

// Rutas de autenticación
app.use('/auth', authLimiter, authRoutes);

// Rutas del Panel de Gestión (lee de barber_* tables - misma BD que la app cliente)
const {
    verifyAdmin,
    getDashboardStats, getBookings, getCalendarBookings,
    cancelBooking: panelCancelBooking, confirmBooking: panelConfirmBooking, getClients: panelGetClients,
    getProfessionals: panelGetProfessionals, getServices: panelGetServices
} = require('./controllers/panelController');

app.get('/panel/dashboard', verifyAdmin, getDashboardStats);
app.get('/panel/bookings', verifyAdmin, getBookings);
app.get('/panel/bookings/calendar', verifyAdmin, getCalendarBookings);
app.patch('/panel/bookings/:id/cancel', verifyAdmin, panelCancelBooking);
app.patch('/panel/bookings/:id/confirm', verifyAdmin, panelConfirmBooking);
app.get('/panel/clients', verifyAdmin, panelGetClients);
app.get('/panel/professionals', verifyAdmin, panelGetProfessionals);
app.get('/panel/services', verifyAdmin, panelGetServices);

// Rutas privadas (owner + professional)
app.use('/api', apiRoutes);

// 404
app.use((req, res) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: `Ruta ${req.method} ${req.path} no encontrada.`
        }
    });
});

// Error handler centralizado
app.use(errorHandler);

// =====================================================
// INICIAR SERVIDOR
// =====================================================
app.listen(PORT, () => {
    console.log('');
    console.log('=====================================================');
    console.log('  🏪 BARBERÍA CRISTIAN - BACKEND API');
    console.log('=====================================================');
    console.log(`  📡 Servidor:    http://localhost:${PORT}`);
    console.log(`  🌍 Entorno:     ${process.env.NODE_ENV || 'development'}`);
    console.log(`  🔗 Supabase:    ${process.env.SUPABASE_URL}`);
    console.log('');
    console.log('  📋 Rutas disponibles:');
    console.log('  ────────────────────────────────────────');
    console.log('  PÚBLICAS (sin auth):');
    console.log('    GET  /health');
    console.log('    GET  /public/availability');
    console.log('    GET  /public/business/:slug');
    console.log('    GET  /public/professionals');
    console.log('    GET  /public/services');
    console.log('    POST /public/appointments');
    console.log('    POST /public/slot-holds');
    console.log('');
    console.log('  AUTH:');
    console.log('    POST /auth/login');
    console.log('    GET  /auth/me');
    console.log('');
    console.log('  PRIVADAS (requieren token):');
    console.log('    GET    /api/dashboard             (owner)');
    console.log('    GET    /api/appointments           (owner: todas, pro: suyas)');
    console.log('    GET    /api/appointments/:id       (owner/pro)');
    console.log('    PATCH  /api/appointments/:id/cancel(owner/pro)');
    console.log('    PATCH  /api/appointments/:id/status(owner)');
    console.log('    GET    /api/professionals          (owner)');
    console.log('    POST   /api/professionals          (owner)');
    console.log('    GET    /api/services               (owner)');
    console.log('    POST   /api/services               (owner)');
    console.log('    GET    /api/clients                (owner)');
    console.log('    GET    /api/settings               (owner)');
    console.log('  ────────────────────────────────────────');
    console.log('');
    console.log('  ✅ Servidor listo!');
    console.log('=====================================================');
});

module.exports = app;
