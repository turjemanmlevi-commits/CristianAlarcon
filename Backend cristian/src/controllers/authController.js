/**
 * Controlador de Autenticación
 * 
 * Endpoints:
 *   POST /auth/login - Login para dueño y profesionales
 *   POST /auth/me - Obtener datos del usuario actual
 *   POST /auth/logout - Cerrar sesión
 */
const { supabaseAdmin, supabase } = require('../config/supabase');

/**
 * POST /auth/login
 * Login con email y contraseña
 * Verifica que el usuario tenga un rol asignado (owner/professional)
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Email y contraseña son requeridos.'
                }
            });
        }

        // Autenticar con Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            console.error('Error de autenticación:', authError);
            return res.status(401).json({
                error: {
                    code: 'AUTH_FAILED',
                    message: 'Credenciales inválidas.'
                }
            });
        }

        // Verificar que el usuario tiene un rol en el sistema de barbería
        const { data: barberiaUser, error: userError } = await supabaseAdmin
            .from('barberia_users')
            .select(`
        *,
        barberia_businesses(id, name, slug, logo_url, theme_color),
        barberia_professionals(id, display_name, photo_url, specialty)
      `)
            .eq('auth_user_id', authData.user.id)
            .eq('active', true)
            .maybeSingle();

        if (userError || !barberiaUser) {
            return res.status(403).json({
                error: {
                    code: 'NOT_AUTHORIZED',
                    message: 'No tienes permisos para acceder al sistema de la barbería.'
                }
            });
        }

        res.json({
            message: 'Login exitoso.',
            user: {
                id: barberiaUser.id,
                auth_user_id: authData.user.id,
                email: barberiaUser.email,
                name: barberiaUser.name,
                role: barberiaUser.role,
                business: barberiaUser.barberia_businesses,
                professional: barberiaUser.barberia_professionals?.[0] || null
            },
            session: {
                access_token: authData.session.access_token,
                refresh_token: authData.session.refresh_token,
                expires_at: authData.session.expires_at
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /auth/me
 * Obtener datos del usuario actual (requiere autenticación)
 */
const getMe = async (req, res, next) => {
    try {
        const { authUserId, businessId } = req.user;

        const { data, error } = await supabaseAdmin
            .from('barberia_users')
            .select(`
        *,
        barberia_businesses(id, name, slug, logo_url, theme_color, timezone),
        barberia_professionals(id, display_name, photo_url, specialty, bio)
      `)
            .eq('auth_user_id', authUserId)
            .eq('business_id', businessId)
            .eq('active', true)
            .maybeSingle();

        if (error || !data) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Usuario no encontrado.' }
            });
        }

        res.json({
            user: {
                id: data.id,
                email: data.email,
                name: data.name,
                phone: data.phone,
                role: data.role,
                avatar_url: data.avatar_url,
                business: data.barberia_businesses,
                professional: data.barberia_professionals?.[0] || null,
                created_at: data.created_at
            }
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { login, getMe };
