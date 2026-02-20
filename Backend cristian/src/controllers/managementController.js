/**
 * Controlador de Gestión del Negocio
 * Solo accesible por el dueño (owner)
 * 
 * Incluye gestión de:
 * - Profesionales
 * - Servicios
 * - Horarios
 * - Bloqueos de tiempo
 * - Clientes
 * - Dashboard/Estadísticas
 */
const { supabaseAdmin } = require('../config/supabase');

// ================================================
// PROFESIONALES
// ================================================

const listProfessionals = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('barberia_professionals')
            .select('*, barberia_users(email, role), barberia_professional_services(*, barberia_services(*))')
            .eq('business_id', req.user.businessId)
            .order('sort_order');

        if (error) throw error;
        res.json({ professionals: data || [] });
    } catch (err) { next(err); }
};

const createProfessional = async (req, res, next) => {
    try {
        const { email, password, name, display_name, phone, specialty, photo_url, bio } = req.body;

        // 1. Crear usuario en Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (authError) {
            console.error('Error creando usuario auth:', authError);
            return res.status(400).json({
                error: { code: 'AUTH_ERROR', message: authError.message }
            });
        }

        // 2. Crear en barberia_users
        const { data: barberiaUser, error: userError } = await supabaseAdmin
            .from('barberia_users')
            .insert({
                auth_user_id: authUser.user.id,
                business_id: req.user.businessId,
                role: 'professional',
                email,
                name: name || display_name,
                phone
            })
            .select()
            .single();

        if (userError) throw userError;

        // 3. Crear en barberia_professionals
        const { data: professional, error: profError } = await supabaseAdmin
            .from('barberia_professionals')
            .insert({
                user_id: barberiaUser.id,
                business_id: req.user.businessId,
                display_name: display_name || name,
                specialty,
                photo_url,
                bio
            })
            .select()
            .single();

        if (profError) throw profError;

        res.status(201).json({ professional });
    } catch (err) { next(err); }
};

const updateProfessional = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { display_name, specialty, photo_url, bio, active, sort_order } = req.body;

        const updateData = {};
        if (display_name !== undefined) updateData.display_name = display_name;
        if (specialty !== undefined) updateData.specialty = specialty;
        if (photo_url !== undefined) updateData.photo_url = photo_url;
        if (bio !== undefined) updateData.bio = bio;
        if (active !== undefined) updateData.active = active;
        if (sort_order !== undefined) updateData.sort_order = sort_order;

        const { data, error } = await supabaseAdmin
            .from('barberia_professionals')
            .update(updateData)
            .eq('id', parseInt(id))
            .eq('business_id', req.user.businessId)
            .select()
            .single();

        if (error) throw error;
        res.json({ professional: data });
    } catch (err) { next(err); }
};

// ================================================
// SERVICIOS
// ================================================

const listServices = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('barberia_services')
            .select('*')
            .eq('business_id', req.user.businessId)
            .order('sort_order');

        if (error) throw error;
        res.json({ services: data || [] });
    } catch (err) { next(err); }
};

const createService = async (req, res, next) => {
    try {
        const { name, description, duration_minutes, price, buffer_before_minutes, buffer_after_minutes, color, icon } = req.body;

        const { data, error } = await supabaseAdmin
            .from('barberia_services')
            .insert({
                business_id: req.user.businessId,
                name,
                description,
                duration_minutes: duration_minutes || 30,
                price: price || 0,
                buffer_before_minutes: buffer_before_minutes || 0,
                buffer_after_minutes: buffer_after_minutes || 5,
                color: color || '#FFD700',
                icon
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ service: data });
    } catch (err) { next(err); }
};

const updateService = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        delete updates.id;
        delete updates.business_id;

        const { data, error } = await supabaseAdmin
            .from('barberia_services')
            .update(updates)
            .eq('id', parseInt(id))
            .eq('business_id', req.user.businessId)
            .select()
            .single();

        if (error) throw error;
        res.json({ service: data });
    } catch (err) { next(err); }
};

// ================================================
// ASIGNACIÓN PROFESIONAL-SERVICIO
// ================================================

const assignServiceToProfessional = async (req, res, next) => {
    try {
        const { professional_id, service_id, custom_price, custom_duration_minutes } = req.body;

        const { data, error } = await supabaseAdmin
            .from('barberia_professional_services')
            .upsert({
                professional_id,
                service_id,
                custom_price,
                custom_duration_minutes,
                active: true
            }, { onConflict: 'professional_id,service_id' })
            .select()
            .single();

        if (error) throw error;
        res.json({ assignment: data });
    } catch (err) { next(err); }
};

const removeServiceFromProfessional = async (req, res, next) => {
    try {
        const { professional_id, service_id } = req.params;

        const { error } = await supabaseAdmin
            .from('barberia_professional_services')
            .delete()
            .eq('professional_id', parseInt(professional_id))
            .eq('service_id', parseInt(service_id));

        if (error) throw error;
        res.json({ message: 'Servicio desasignado del profesional.' });
    } catch (err) { next(err); }
};

// ================================================
// HORARIOS DEL NEGOCIO
// ================================================

const getBusinessHours = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('barberia_business_hours')
            .select('*')
            .eq('business_id', req.user.businessId)
            .order('day_of_week');

        if (error) throw error;
        res.json({ hours: data || [] });
    } catch (err) { next(err); }
};

const setBusinessHours = async (req, res, next) => {
    try {
        const { hours } = req.body; // Array de { day_of_week, open_time, close_time, is_closed }

        if (!Array.isArray(hours)) {
            return res.status(400).json({
                error: { code: 'VALIDATION_ERROR', message: 'hours debe ser un array.' }
            });
        }

        const records = hours.map(h => ({
            business_id: req.user.businessId,
            day_of_week: h.day_of_week,
            open_time: h.open_time,
            close_time: h.close_time,
            is_closed: h.is_closed || false
        }));

        const { data, error } = await supabaseAdmin
            .from('barberia_business_hours')
            .upsert(records, { onConflict: 'business_id,day_of_week' })
            .select();

        if (error) throw error;
        res.json({ hours: data });
    } catch (err) { next(err); }
};

// ================================================
// HORARIOS DE PROFESIONALES
// ================================================

const getProfessionalHours = async (req, res, next) => {
    try {
        const { professional_id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('barberia_professional_hours')
            .select('*')
            .eq('professional_id', parseInt(professional_id))
            .order('day_of_week');

        if (error) throw error;
        res.json({ hours: data || [] });
    } catch (err) { next(err); }
};

const setProfessionalHours = async (req, res, next) => {
    try {
        const { professional_id } = req.params;
        const { hours } = req.body;

        const records = hours.map(h => ({
            professional_id: parseInt(professional_id),
            day_of_week: h.day_of_week,
            start_time: h.start_time,
            end_time: h.end_time,
            is_available: h.is_available !== false
        }));

        const { data, error } = await supabaseAdmin
            .from('barberia_professional_hours')
            .upsert(records, { onConflict: 'professional_id,day_of_week' })
            .select();

        if (error) throw error;
        res.json({ hours: data });
    } catch (err) { next(err); }
};

// ================================================
// BLOQUEOS DE TIEMPO
// ================================================

const listTimeBlocks = async (req, res, next) => {
    try {
        const { professional_id, from, to } = req.query;

        let query = supabaseAdmin
            .from('barberia_time_blocks')
            .select('*, barberia_professionals(display_name)')
            .eq('business_id', req.user.businessId)
            .order('start_at');

        if (professional_id) query = query.eq('professional_id', parseInt(professional_id));
        if (from) query = query.gte('start_at', from);
        if (to) query = query.lte('end_at', to);

        const { data, error } = await query;
        if (error) throw error;
        res.json({ time_blocks: data || [] });
    } catch (err) { next(err); }
};

const createTimeBlock = async (req, res, next) => {
    try {
        const { professional_id, title, start_at, end_at, all_day, reason } = req.body;

        const { data, error } = await supabaseAdmin
            .from('barberia_time_blocks')
            .insert({
                business_id: req.user.businessId,
                professional_id: professional_id || null,
                title: title || 'Bloqueado',
                start_at,
                end_at,
                all_day: all_day || false,
                reason,
                created_by: req.user.barberiaUserId
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ time_block: data });
    } catch (err) { next(err); }
};

const deleteTimeBlock = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('barberia_time_blocks')
            .delete()
            .eq('id', parseInt(id))
            .eq('business_id', req.user.businessId);

        if (error) throw error;
        res.json({ message: 'Bloqueo eliminado.' });
    } catch (err) { next(err); }
};

// ================================================
// CLIENTES
// ================================================

const listClients = async (req, res, next) => {
    try {
        const { search, page = 1, limit = 50 } = req.query;

        let query = supabaseAdmin
            .from('barberia_clients')
            .select('*', { count: 'exact' })
            .eq('business_id', req.user.businessId)
            .order('name');

        if (search) {
            query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);
        query = query.range(offset, offset + parseInt(limit) - 1);

        const { data, error, count } = await query;
        if (error) throw error;
        res.json({ clients: data || [], total: count });
    } catch (err) { next(err); }
};

const getClientHistory = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: client, error: clientError } = await supabaseAdmin
            .from('barberia_clients')
            .select('*')
            .eq('id', parseInt(id))
            .eq('business_id', req.user.businessId)
            .single();

        if (clientError || !client) {
            return res.status(404).json({
                error: { code: 'NOT_FOUND', message: 'Cliente no encontrado.' }
            });
        }

        const { data: appointments, error: apptError } = await supabaseAdmin
            .from('barberia_appointments')
            .select('*, barberia_professionals(display_name), barberia_services(name, price)')
            .eq('client_id', parseInt(id))
            .order('start_at', { ascending: false })
            .limit(50);

        if (apptError) throw apptError;

        res.json({
            client,
            appointments: appointments || []
        });
    } catch (err) { next(err); }
};

// ================================================
// DASHBOARD / ESTADÍSTICAS (solo owner)
// ================================================

const getDashboard = async (req, res, next) => {
    try {
        const businessId = req.user.businessId;
        const today = new Date().toISOString().split('T')[0];

        // Citas de hoy
        const { data: todayAppointments } = await supabaseAdmin
            .from('barberia_appointments')
            .select('*, barberia_professionals(display_name), barberia_services(name, price, color)')
            .eq('business_id', businessId)
            .gte('start_at', `${today}T00:00:00`)
            .lte('start_at', `${today}T23:59:59`)
            .neq('status', 'CANCELLED')
            .order('start_at');

        // Estadísticas del mes
        const firstOfMonth = `${today.substring(0, 7)}-01`;
        const { data: monthStats } = await supabaseAdmin
            .from('barberia_appointments')
            .select('id, status, price')
            .eq('business_id', businessId)
            .gte('start_at', `${firstOfMonth}T00:00:00`)
            .lte('start_at', `${today}T23:59:59`);

        const completed = (monthStats || []).filter(a => a.status === 'COMPLETED');
        const totalRevenue = completed.reduce((sum, a) => sum + parseFloat(a.price || 0), 0);

        // Total clientes
        const { count: totalClients } = await supabaseAdmin
            .from('barberia_clients')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', businessId);

        // Total profesionales activos
        const { count: totalProfessionals } = await supabaseAdmin
            .from('barberia_professionals')
            .select('id', { count: 'exact', head: true })
            .eq('business_id', businessId)
            .eq('active', true);

        res.json({
            today: {
                appointments: todayAppointments || [],
                total: (todayAppointments || []).length
            },
            month: {
                total_appointments: (monthStats || []).length,
                completed: completed.length,
                cancelled: (monthStats || []).filter(a => a.status === 'CANCELLED').length,
                no_show: (monthStats || []).filter(a => a.status === 'NO_SHOW').length,
                revenue: totalRevenue
            },
            totals: {
                clients: totalClients || 0,
                professionals: totalProfessionals || 0
            }
        });
    } catch (err) { next(err); }
};

// ================================================
// CONFIGURACIÓN DEL NEGOCIO
// ================================================

const getSettings = async (req, res, next) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('barberia_settings')
            .select('*')
            .eq('business_id', req.user.businessId)
            .maybeSingle();

        if (error) throw error;
        res.json({ settings: data || {} });
    } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
    try {
        const updates = req.body;
        delete updates.id;
        delete updates.business_id;

        const { data, error } = await supabaseAdmin
            .from('barberia_settings')
            .upsert({
                business_id: req.user.businessId,
                ...updates
            }, { onConflict: 'business_id' })
            .select()
            .single();

        if (error) throw error;
        res.json({ settings: data });
    } catch (err) { next(err); }
};

module.exports = {
    listProfessionals, createProfessional, updateProfessional,
    listServices, createService, updateService,
    assignServiceToProfessional, removeServiceFromProfessional,
    getBusinessHours, setBusinessHours,
    getProfessionalHours, setProfessionalHours,
    listTimeBlocks, createTimeBlock, deleteTimeBlock,
    listClients, getClientHistory,
    getDashboard,
    getSettings, updateSettings
};
