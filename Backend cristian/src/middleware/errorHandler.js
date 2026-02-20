/**
 * Middleware de manejo de errores centralizado
 */

const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err);

    // Error de PostgreSQL: violación de constraint único (409 Conflict)
    if (err.code === '23505') {
        return res.status(409).json({
            error: {
                code: 'SLOT_UNAVAILABLE',
                message: 'El horario seleccionado ya no está disponible.',
                action: 'REFRESH_AVAILABILITY',
                availability_hint: {
                    date: req.body?.start_at?.split('T')[0],
                    professional_id: req.body?.professional_id,
                    service_id: req.body?.service_id
                }
            }
        });
    }

    // Error de validación
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: err.message,
                details: err.details || null
            }
        });
    }

    // Error genérico
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: {
            code: err.code || 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'Error interno del servidor.'
                : err.message
        }
    });
};

module.exports = { errorHandler };
