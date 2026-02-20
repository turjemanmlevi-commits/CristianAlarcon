/**
 * Controlador de Citas (Público + Privado)
 * 
 * Endpoints públicos:
 *   POST /public/appointments - Crear cita (clientes)
 *   POST /public/slot-holds - Crear reserva temporal
 * 
 * Endpoints privados:
 *   GET /api/appointments - Listar citas (owner: todas, professional: las suyas)
 *   GET /api/appointments/:id - Detalle de cita
 *   PATCH /api/appointments/:id - Actualizar cita
 *   PATCH /api/appointments/:id/cancel - Cancelar cita
 *   PATCH /api/appointments/:id/status - Cambiar estado
 */
const { supabaseAdmin } = require('../config/supabase');

// ========================
// ENDPOINTS PÚBLICOS
// ========================

/**
 * POST /public/appointments
 * Crear cita con control de concurrencia
 */
const createAppointment = async (req, res, next) => {
    try {
        const { business_id, service_id, professional_id, start_at, client, hold_id, notes } = req.body;

        // Llamar a la función de PostgreSQL con control de concurrencia
        const { data, error } = await supabaseAdmin.rpc('barberia_create_appointment', {
            p_business_id: business_id,
            p_service_id: service_id,
            p_professional_id: professional_id,
            p_start_at: start_at,
            p_client_name: client.name,
            p_client_phone: client.phone,
            p_client_email: client.email || null,
            p_hold_id: hold_id || null,
            p_notes: notes || null
        });

        if (error) {
            console.error('Error creando cita:', error);

            // PostgreSQL constraint violation = 409 Conflict
            if (error.code === '23505') {
                return res.status(409).json({
                    error: {
                        code: 'SLOT_UNAVAILABLE',
                        message: 'El horario seleccionado ya no está disponible.',
                        action: 'REFRESH_AVAILABILITY',
                        availability_hint: {
                            date: start_at.split('T')[0],
                            professional_id: professional_id,
                            service_id: service_id
                        }
                    }
                });
            }

            return res.status(500).json({
                error: {
                    code: 'APPOINTMENT_ERROR',
                    message: 'Error al crear la cita.'
                }
            });
        }

        const result = data?.[0];

        // Si la función devolvió un código de error
        if (result?.error_code) {
            const statusCode = result.error_code === 'SLOT_UNAVAILABLE' ? 409 : 400;
            return res.status(statusCode).json({
                error: {
                    code: result.error_code,
                    message: result.error_message,
                    action: result.error_code === 'SLOT_UNAVAILABLE' ? 'REFRESH_AVAILABILITY' : undefined,
                    availability_hint: result.error_code === 'SLOT_UNAVAILABLE' ? {
                        date: start_at.split('T')[0],
                        professional_id: professional_id,
                        service_id: service_id
                    } : undefined
                }
            });
        }

        // Éxito → 201 Created
        res.status(201).json({
            appointment_id: result.appointment_id,
            status: result.status,
            start_at: result.start_time,
            end_at: result.end_time
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /public/slot-holds
 * Crear reserva temporal (TTL 2 minutos)
 */
const createSlotHold = async (req, res, next) => {
    try {
        const { business_id, service_id, professional_id, start_at } = req.body;

        const { data, error } = await supabaseAdmin.rpc('barberia_create_slot_hold', {
            p_business_id: business_id,
            p_service_id: service_id,
            p_professional_id: professional_id,
            p_start_at: start_at
        });

        if (error) {
            // Slot ya tiene un hold activo
            if (error.code === '23505') {
                return res.status(409).json({
                    error: {
                        code: 'SLOT_UNAVAILABLE',
                        message: 'El horario seleccionado ya no está disponible.',
                        action: 'REFRESH_AVAILABILITY',
                        availability_hint: {
                            date: start_at.split('T')[0],
                            professional_id: professional_id,
                            service_id: service_id
                        }
                    }
                });
            }

            console.error('Error creando slot hold:', error);
            return res.status(500).json({
                error: {
                    code: 'HOLD_ERROR',
                    message: 'Error al reservar temporalmente el horario.'
                }
            });
        }

        const result = data?.[0];
        res.status(201).json({
            hold_id: result.hold_id,
            expires_at: result.expires_at
        });
    } catch (err) {
        next(err);
    }
};

// ========================
// ENDPOINTS PRIVADOS
// ========================

/**
 * GET /api/appointments
 * - Owner: ve TODAS las citas del negocio
 * - Professional: ve SOLO sus citas
 */
const listAppointments = async (req, res, next) => {
    try {
        const { role, businessId, professional } = req.user;
        const { date, status, professional_id, page = 1, limit = 50 } = req.query;

        let query = supabaseAdmin
            .from('barberia_appointments')
            .select(`
        *,
        barberia_professionals(id, display_name, photo_url),
        barberia_services(id, name, duration_minutes, price, color),
        barberia_clients(id, name, phone, email, total_visits)
      `)
            .eq('business_id', businessId)
            .order('start_at', { ascending: true });

        // Si es profesional, solo ve sus propias citas
        if (role === 'professional' && professional) {
            query = query.eq('professional_id', professional.id);
        }

        // Filtros opcionales
        if (date) {
            const startOfDay = `${date}T00:00:00`;
            const endOfDay = `${date}T23:59:59`;
            query = query.gte('start_at', startOfDay).lte('start_at', endOfDay);
        }

        if (status) {
            query = query.eq('status', status);
        }

        if (professional_id && role === 'owner') {
            query = query.eq('professional_id', parseInt(professional_id));
        }

        // Paginación
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Error listando citas:', error);
            return res.status(500).json({
                error: {
                    code: 'LIST_ERROR',
                    message: 'Error al obtener las citas.'
                }
            });
        }

        res.json({
            appointments: data || [],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/appointments/:id
 * Detalle de una cita específica
 */
const getAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role, businessId, professional } = req.user;

        let query = supabaseAdmin
            .from('barberia_appointments')
            .select(`
        *,
        barberia_professionals(id, display_name, photo_url, specialty),
        barberia_services(id, name, description, duration_minutes, price, color),
        barberia_clients(id, name, phone, email, total_visits, notes)
      `)
            .eq('id', parseInt(id))
            .eq('business_id', businessId);

        // Profesional solo ve sus citas
        if (role === 'professional' && professional) {
            query = query.eq('professional_id', professional.id);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
            console.error('Error obteniendo cita:', error);
            return res.status(500).json({
                error: { code: 'GET_ERROR', message: 'Error al obtener la cita.' }
            });
        }

        if (!data) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Cita no encontrada.' }
            });
        }

        res.json(data);
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/appointments/:id/cancel
 * Cancelar una cita
 */
const cancelAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const { barberiaUserId, businessId, role, professional } = req.user;

        // Construir condiciones según rol
        let query = supabaseAdmin
            .from('barberia_appointments')
            .update({
                status: 'CANCELLED',
                cancelled_at: new Date().toISOString(),
                cancelled_by: barberiaUserId,
                cancellation_reason: reason || 'Cancelada por el personal'
            })
            .eq('id', parseInt(id))
            .eq('business_id', businessId)
            .in('status', ['PENDING', 'CONFIRMED']);

        // Profesional solo cancela sus citas
        if (role === 'professional' && professional) {
            query = query.eq('professional_id', professional.id);
        }

        const { data, error, count } = await query.select();

        if (error) {
            console.error('Error cancelando cita:', error);
            return res.status(500).json({
                error: { code: 'CANCEL_ERROR', message: 'Error al cancelar la cita.' }
            });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Cita no encontrada o ya no se puede cancelar.' }
            });
        }

        res.json({
            message: 'Cita cancelada exitosamente.',
            appointment: data[0]
        });
    } catch (err) {
        next(err);
    }
};

/**
 * PATCH /api/appointments/:id/status
 * Cambiar estado de una cita (solo owner)
 */
const updateAppointmentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                error: {
                    code: 'INVALID_STATUS',
                    message: `Estado inválido. Valores permitidos: ${validStatuses.join(', ')}`
                }
            });
        }

        const updateData = { status };
        if (status === 'CANCELLED') {
            updateData.cancelled_at = new Date().toISOString();
            updateData.cancelled_by = req.user.barberiaUserId;
        }

        const { data, error } = await supabaseAdmin
            .from('barberia_appointments')
            .update(updateData)
            .eq('id', parseInt(id))
            .eq('business_id', req.user.businessId)
            .select();

        if (error) {
            console.error('Error actualizando estado:', error);
            return res.status(500).json({
                error: { code: 'UPDATE_ERROR', message: 'Error al actualizar el estado.' }
            });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Cita no encontrada.' }
            });
        }

        res.json({
            message: 'Estado actualizado.',
            appointment: data[0]
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createAppointment,
    createSlotHold,
    listAppointments,
    getAppointment,
    cancelAppointment,
    updateAppointmentStatus
};
