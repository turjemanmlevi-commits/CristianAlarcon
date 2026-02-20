/**
 * Middleware de validación de datos de entrada
 */

/**
 * Validar datos requeridos para crear una cita
 */
const validateAppointment = (req, res, next) => {
    const { business_id, service_id, professional_id, start_at, client } = req.body;

    const errors = [];

    if (!business_id) errors.push('business_id es requerido');
    if (!service_id) errors.push('service_id es requerido');
    if (!professional_id) errors.push('professional_id es requerido');
    if (!start_at) errors.push('start_at es requerido');

    if (!client || typeof client !== 'object') {
        errors.push('Datos del cliente son requeridos');
    } else {
        if (!client.name || client.name.trim().length === 0) {
            errors.push('El nombre del cliente es requerido');
        }
        if (!client.phone || client.phone.trim().length === 0) {
            errors.push('El teléfono del cliente es requerido');
        }
    }

    // Validar formato de fecha
    if (start_at) {
        const date = new Date(start_at);
        if (isNaN(date.getTime())) {
            errors.push('start_at debe ser una fecha válida en formato ISO 8601');
        }
        if (date <= new Date()) {
            errors.push('start_at debe ser una fecha futura');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Datos de entrada inválidos.',
                details: errors
            }
        });
    }

    next();
};

/**
 * Validar datos para consulta de disponibilidad
 */
const validateAvailabilityQuery = (req, res, next) => {
    const { businessId, serviceId, professionalId, date } = req.query;

    const errors = [];

    if (!businessId) errors.push('businessId es requerido');
    if (!serviceId) errors.push('serviceId es requerido');
    if (!professionalId) errors.push('professionalId es requerido');
    if (!date) errors.push('date es requerido (formato YYYY-MM-DD)');

    if (date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            errors.push('date debe tener el formato YYYY-MM-DD');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Parámetros de consulta inválidos.',
                details: errors
            }
        });
    }

    next();
};

/**
 * Validar datos para crear un slot hold
 */
const validateSlotHold = (req, res, next) => {
    const { business_id, service_id, professional_id, start_at } = req.body;

    const errors = [];

    if (!business_id) errors.push('business_id es requerido');
    if (!service_id) errors.push('service_id es requerido');
    if (!professional_id) errors.push('professional_id es requerido');
    if (!start_at) errors.push('start_at es requerido');

    if (errors.length > 0) {
        return res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Datos de entrada inválidos.',
                details: errors
            }
        });
    }

    next();
};

module.exports = { validateAppointment, validateAvailabilityQuery, validateSlotHold };
