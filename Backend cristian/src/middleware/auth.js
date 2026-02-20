/**
 * Middleware de autenticación para Barbería Cristian
 * - Verifica el token JWT de Supabase
 * - Identifica al usuario y su rol (owner/professional)
 */
const { supabaseAdmin } = require('../config/supabase');

/**
 * Middleware para verificar autenticación
 * Extrae el token de Authorization header y verifica con Supabase
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Token de autenticación requerido.'
                }
            });
        }

        const token = authHeader.replace('Bearer ', '');

        // Verificar token con Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Token inválido o expirado.'
                }
            });
        }

        // Obtener datos del usuario en barberia_users
        const { data: barberiaUser, error: userError } = await supabaseAdmin
            .from('barberia_users')
            .select('*, barberia_professionals(*)')
            .eq('auth_user_id', user.id)
            .eq('active', true)
            .maybeSingle();

        if (userError) {
            console.error('Error obteniendo usuario de barbería:', userError);
            return res.status(500).json({
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Error interno del servidor.'
                }
            });
        }

        if (!barberiaUser) {
            return res.status(403).json({
                error: {
                    code: 'NOT_A_BARBERIA_USER',
                    message: 'No tienes permisos para acceder al sistema de la barbería.'
                }
            });
        }

        // Adjuntar usuario al request
        req.user = {
            authUserId: user.id,
            barberiaUserId: barberiaUser.id,
            businessId: barberiaUser.business_id,
            role: barberiaUser.role,
            name: barberiaUser.name,
            email: barberiaUser.email,
            professional: barberiaUser.barberia_professionals?.[0] || null
        };

        next();
    } catch (err) {
        console.error('Error en autenticación:', err);
        return res.status(500).json({
            error: {
                code: 'AUTH_ERROR',
                message: 'Error en la autenticación.'
            }
        });
    }
};

/**
 * Middleware para verificar rol de dueño
 * El dueño puede ver absolutamente todo
 */
const requireOwner = (req, res, next) => {
    if (!req.user || req.user.role !== 'owner') {
        return res.status(403).json({
            error: {
                code: 'FORBIDDEN',
                message: 'Solo el dueño de la barbería puede realizar esta acción.'
            }
        });
    }
    next();
};

/**
 * Middleware para verificar rol de profesional
 * El profesional solo puede gestionar sus propias citas
 */
const requireProfessional = (req, res, next) => {
    if (!req.user || req.user.role !== 'professional') {
        return res.status(403).json({
            error: {
                code: 'FORBIDDEN',
                message: 'Solo los profesionales pueden realizar esta acción.'
            }
        });
    }
    next();
};

/**
 * Middleware para verificar que es owner O professional
 */
const requireAuth = (req, res, next) => {
    if (!req.user || !['owner', 'professional'].includes(req.user.role)) {
        return res.status(403).json({
            error: {
                code: 'FORBIDDEN',
                message: 'No tienes permisos para realizar esta acción.'
            }
        });
    }
    next();
};

module.exports = { authenticate, requireOwner, requireProfessional, requireAuth };
