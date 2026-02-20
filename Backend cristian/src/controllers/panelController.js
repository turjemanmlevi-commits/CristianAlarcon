/**
 * Dashboard Controller - Reads from barber_* tables
 * (same tables used by the client app at barberiacristian.reservabarbero.com)
 * 
 * This ensures appointments booked by clients appear in the admin dashboard.
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TENANT_ID = 'ba96c54d-42c4-48af-b4ef-765283447a19'; // Updated to match current tenant

// Allowed admin emails
const ADMIN_EMAILS = [
    'cristian@barberiacristian.com',
    'leviturjeman@gmail.com',
    'turjemanlevi@gmail.com',
    'turjemanmlevi@gmail.com'
];

/**
 * Middleware: verify Supabase auth token and check admin access
 */
const verifyAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token requerido' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Token invalido' });
        }

        if (!ADMIN_EMAILS.includes(user.email?.toLowerCase())) {
            return res.status(403).json({ error: 'Acceso denegado' });
        }

        req.adminUser = user;
        next();
    } catch (err) {
        res.status(500).json({ error: 'Error de autenticacion' });
    }
};

/**
 * GET /panel/dashboard - Stats overview
 */
const getDashboardStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const monthStart = today.substring(0, 7) + '-01';

        // Today's bookings
        const { data: todayBookings, error: e1 } = await supabaseAdmin
            .from('barber_bookings')
            .select('*, barber_services(name, price), barber_professionals(name, photo_url)')
            .or(`tenant_id.eq.${TENANT_ID},tenant_id.is.null`)
            .gte('start_datetime', today + 'T00:00:00')
            .lte('start_datetime', today + 'T23:59:59')
            .order('start_datetime');

        if (e1) throw e1;

        // Month stats
        const { data: monthBookings, error: e2 } = await supabaseAdmin
            .from('barber_bookings')
            .select('id, status, barber_services(price)')
            .or(`tenant_id.eq.${TENANT_ID},tenant_id.is.null`)
            .gte('start_datetime', monthStart + 'T00:00:00')
            .lte('start_datetime', today + 'T23:59:59');

        if (e2) throw e2;

        // Professionals
        const { data: pros } = await supabaseAdmin
            .from('barber_professionals')
            .select('*')
            .or(`tenant_id.eq.${TENANT_ID},tenant_id.is.null`)
            .eq('is_active', true)
            .order('priority');

        // Services
        const { data: svcs } = await supabaseAdmin
            .from('barber_services')
            .select('*')
            .or(`tenant_id.eq.${TENANT_ID},tenant_id.is.null`)
            .eq('is_active', true)
            .order('price');

        const active = (todayBookings || []).filter(b => b.status !== 'cancelled');
        const completed = (monthBookings || []).filter(b => ['confirmed', 'completed'].includes(b.status));
        const cancelled = (monthBookings || []).filter(b => b.status === 'cancelled');
        const revenue = completed.reduce((sum, b) => sum + parseFloat(b.barber_services?.price || 0), 0);

        // Enrich today's bookings with client info
        const enrichedToday = await enrichBookingsWithUserData(todayBookings || []);

        res.json({
            today: {
                bookings: enrichedToday,
                active: active.length
            },
            month: {
                total: (monthBookings || []).length,
                completed: completed.length,
                cancelled: cancelled.length,
                revenue
            },
            professionals: pros || [],
            services: svcs || []
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /panel/bookings - List bookings with filters
 */
const getBookings = async (req, res) => {
    try {
        const { from, to, professional_id, status, limit: lim } = req.query;
        const limit = parseInt(lim) || 200;

        let query = supabaseAdmin
            .from('barber_bookings')
            .select('*, barber_services(name, price), barber_professionals(name, photo_url)')
            .or(`tenant_id.eq.${TENANT_ID},tenant_id.is.null`)
            .order('start_datetime', { ascending: false })
            .limit(limit);

        if (from) query = query.gte('start_datetime', from + 'T00:00:00');
        if (to) query = query.lte('start_datetime', to + 'T23:59:59');
        if (professional_id) query = query.eq('professional_id', professional_id);
        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;

        // Enrich with user metadata (name, email, phone)
        const enriched = await enrichBookingsWithUserData(data || []);

        res.json(enriched);
    } catch (err) {
        console.error('Bookings error:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /panel/bookings/calendar - Bookings for a month
 */
const getCalendarBookings = async (req, res) => {
    try {
        const { year, month } = req.query;
        const y = parseInt(year) || new Date().getFullYear();
        const m = parseInt(month) || (new Date().getMonth() + 1);

        const firstDay = `${y}-${String(m).padStart(2, '0')}-01`;
        const lastDay = new Date(y, m, 0);
        const lastDayStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

        const { data, error } = await supabaseAdmin
            .from('barber_bookings')
            .select('*, barber_services(name, price), barber_professionals(name, photo_url)')
            .or(`tenant_id.eq.${TENANT_ID},tenant_id.is.null`)
            .gte('start_datetime', firstDay + 'T00:00:00')
            .lte('start_datetime', lastDayStr + 'T23:59:59')
            .order('start_datetime');

        if (error) throw error;

        const enriched = await enrichBookingsWithUserData(data || []);
        res.json(enriched);
    } catch (err) {
        console.error('Calendar error:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * PATCH /panel/bookings/:id/cancel - Cancel a booking
 */
const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('barber_bookings')
            .update({ status: 'cancelled' })
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json({ success: true, booking: data?.[0] });
    } catch (err) {
        console.error('Cancel error:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * PATCH /panel/bookings/:id/confirm - Confirm a booking
 */
const confirmBooking = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('barber_bookings')
            .update({ status: 'confirmed' })
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json({ success: true, booking: data?.[0] });
    } catch (err) {
        console.error('Confirm error:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /panel/clients - Aggregated client list
 */
const getClients = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('barber_bookings')
            .select('user_id, status, start_datetime')
            .or(`tenant_id.eq.${TENANT_ID},tenant_id.is.null`)
            .order('start_datetime', { ascending: false });

        if (error) throw error;

        // Group by user_id
        const userIds = [...new Set((data || []).map(b => b.user_id).filter(Boolean))];

        // Get user metadata from auth
        const clients = [];
        for (const uid of userIds) {
            const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(uid);
            if (!user) continue;

            const userBookings = (data || []).filter(b => b.user_id === uid);
            clients.push({
                id: uid,
                name: user.user_metadata?.full_name || user.user_metadata?.nombre || user.email?.split('@')[0] || 'Cliente',
                email: user.email || '-',
                phone: user.user_metadata?.phone || user.user_metadata?.telefono || user.phone || '-',
                bookings: userBookings.length,
                lastBooking: userBookings[0]?.start_datetime || null
            });
        }

        clients.sort((a, b) => (b.lastBooking || '').localeCompare(a.lastBooking || ''));
        res.json(clients);
    } catch (err) {
        console.error('Clients error:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /panel/professionals - List professionals
 */
const getProfessionals = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('barber_professionals')
            .select('*')
            .or(`tenant_id.eq.${TENANT_ID},tenant_id.is.null`)
            .eq('is_active', true)
            .order('priority');

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /panel/services - List services
 */
const getServices = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('barber_services')
            .select('*')
            .or(`tenant_id.eq.${TENANT_ID},tenant_id.is.null`)
            .eq('is_active', true)
            .order('price');

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Helper: enrich bookings with user auth metadata (name, email, phone)
 */
async function enrichBookingsWithUserData(bookings) {
    const userIds = [...new Set(bookings.map(b => b.user_id).filter(Boolean))];
    const userCache = {};

    for (const uid of userIds) {
        try {
            const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(uid);
            if (user) {
                userCache[uid] = {
                    name: user.user_metadata?.full_name || user.user_metadata?.nombre || user.email?.split('@')[0] || 'Cliente',
                    email: user.email || '',
                    phone: user.user_metadata?.phone || user.user_metadata?.telefono || user.phone || ''
                };
            }
        } catch (e) {
            // skip
        }
    }

    return bookings.map(b => ({
        ...b,
        client_name: userCache[b.user_id]?.name || 'Cliente',
        client_email: userCache[b.user_id]?.email || '',
        client_phone: userCache[b.user_id]?.phone || ''
    }));
}

module.exports = {
    verifyAdmin,
    getDashboardStats,
    getBookings,
    getCalendarBookings,
    cancelBooking,
    confirmBooking,
    getClients,
    getProfessionals,
    getServices
};
