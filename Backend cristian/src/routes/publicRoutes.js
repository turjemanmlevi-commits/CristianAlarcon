/**
 * Rutas Públicas - Accesibles sin autenticación
 * 
 * GET  /public/availability     - Obtener slots disponibles
 * POST /public/appointments     - Crear cita (clientes)
 * POST /public/slot-holds       - Crear reserva temporal
 * GET  /public/business/:slug   - Info pública del negocio
 * GET  /public/professionals    - Lista pública de profesionales
 * GET  /public/services         - Lista pública de servicios
 */
const express = require('express');
const router = express.Router();
const { getAvailability } = require('../controllers/availabilityController');
const { createAppointment, createSlotHold } = require('../controllers/appointmentsController');
const { validateAppointment, validateAvailabilityQuery, validateSlotHold } = require('../middleware/validators');
const { supabaseAdmin } = require('../config/supabase');

// Disponibilidad
router.get('/availability', validateAvailabilityQuery, getAvailability);

// Citas
router.post('/appointments', validateAppointment, createAppointment);

// Slot Holds
router.post('/slot-holds', validateSlotHold, createSlotHold);

// Info pública del negocio
router.get('/business/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;

        const { data, error } = await supabaseAdmin
            .from('barberia_businesses')
            .select(`
        id, name, slug, address, phone, email, timezone, logo_url, theme_color,
        barberia_settings(slot_interval_minutes, max_advance_booking_days, allow_online_booking)
      `)
            .eq('slug', slug)
            .eq('active', true)
            .maybeSingle();

        if (error || !data) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Negocio no encontrado.' }
            });
        }

        res.json({ business: data });
    } catch (err) { next(err); }
});

// Profesionales públicos
router.get('/professionals', async (req, res, next) => {
    try {
        const { businessId } = req.query;

        if (!businessId) {
            return res.status(400).json({
                error: { code: 'VALIDATION_ERROR', message: 'businessId es requerido.' }
            });
        }

        const { data, error } = await supabaseAdmin
            .from('barberia_professionals')
            .select('id, display_name, specialty, photo_url, bio, barberia_professional_services(service_id, custom_price, custom_duration_minutes)')
            .eq('business_id', parseInt(businessId))
            .eq('active', true)
            .order('sort_order');

        if (error) throw error;
        res.json({ professionals: data || [] });
    } catch (err) { next(err); }
});

// Servicios públicos
router.get('/services', async (req, res, next) => {
    try {
        const { businessId } = req.query;

        if (!businessId) {
            return res.status(400).json({
                error: { code: 'VALIDATION_ERROR', message: 'businessId es requerido.' }
            });
        }

        const { data, error } = await supabaseAdmin
            .from('barberia_services')
            .select('id, name, description, duration_minutes, price, color, icon')
            .eq('business_id', parseInt(businessId))
            .eq('active', true)
            .order('sort_order');

        if (error) throw error;
        res.json({ services: data || [] });
    } catch (err) { next(err); }
});

module.exports = router;
