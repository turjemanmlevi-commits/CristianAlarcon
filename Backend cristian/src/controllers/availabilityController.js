/**
 * Controlador de Disponibilidad (Público)
 * Endpoint: GET /public/availability
 * 
 * Genera slots disponibles excluyendo:
 * - Citas existentes
 * - Bloqueos de tiempo
 * - Fuera de horario
 * - Buffers
 * - Slot holds activos
 */
const { supabaseAdmin } = require('../config/supabase');

/**
 * GET /public/availability?businessId=&serviceId=&professionalId=&date=YYYY-MM-DD
 */
const getAvailability = async (req, res, next) => {
    try {
        const { businessId, serviceId, professionalId, date } = req.query;

        // Llamar a la función de PostgreSQL que calcula los slots disponibles
        const { data, error } = await supabaseAdmin.rpc('barberia_get_available_slots', {
            p_business_id: parseInt(businessId),
            p_service_id: parseInt(serviceId),
            p_professional_id: parseInt(professionalId),
            p_date: date
        });

        if (error) {
            console.error('Error obteniendo disponibilidad:', error);
            return res.status(500).json({
                error: {
                    code: 'AVAILABILITY_ERROR',
                    message: 'Error al obtener la disponibilidad.'
                }
            });
        }

        // Formatear respuesta según la especificación
        const slots = (data || []).map(s => s.slot_time);

        res.json({
            date: date,
            service_id: parseInt(serviceId),
            professional_id: parseInt(professionalId),
            timezone: 'Europe/Madrid',
            slots: slots,
            generated_at: new Date().toISOString()
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAvailability };
