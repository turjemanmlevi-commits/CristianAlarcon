/**
 * =====================================================
 * SCRIPT DE SEED - Crear usuarios de la barbería
 * =====================================================
 * 
 * Ejecutar con: node src/seed.js
 * 
 * Crea:
 * - Usuario dueño (owner): cristian@barberiacristian.com / Cristian2026!  
 * - Profesional 1: profesional1@barberiacristian.com / Profesional1!
 * - Profesional 2: profesional2@barberiacristian.com / Profesional2!
 * 
 * IMPORTANTE: Necesitas la SUPABASE_SERVICE_ROLE_KEY en .env
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey || supabaseServiceKey === 'TU_SERVICE_ROLE_KEY_AQUI') {
    console.error('');
    console.error('❌ ERROR: Necesitas configurar SUPABASE_SERVICE_ROLE_KEY en el archivo .env');
    console.error('');
    console.error('   Puedes encontrarla en:');
    console.error('   https://supabase.com/dashboard/project/pjwucakxqubrvbuzvidn/settings/api');
    console.error('   > Project API keys > service_role (secret)');
    console.error('');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function seed() {
    console.log('🌱 Iniciando seed de la Barbería Cristian...');
    console.log('');

    // Obtener business_id
    const { data: business } = await supabase
        .from('barberia_businesses')
        .select('id')
        .eq('slug', 'barberia-cristian')
        .single();

    if (!business) {
        console.error('❌ No se encontró el negocio. Ejecuta primero la migración.');
        process.exit(1);
    }

    const businessId = business.id;
    console.log(`✅ Negocio encontrado: ID ${businessId}`);

    // === CREAR DUEÑO ===
    console.log('');
    console.log('👤 Creando usuario dueño...');

    const { data: ownerAuth, error: ownerAuthErr } = await supabase.auth.admin.createUser({
        email: 'cristian@barberiacristian.com',
        password: 'Cristian2026!',
        email_confirm: true
    });

    if (ownerAuthErr) {
        if (ownerAuthErr.message?.includes('already been registered')) {
            console.log('   ⚠️  El usuario dueño ya existe');
            // Obtener el usuario existente
            const { data: { users } } = await supabase.auth.admin.listUsers();
            const existingOwner = users.find(u => u.email === 'cristian@barberiacristian.com');
            if (existingOwner) {
                await createBarberiaUser(businessId, existingOwner.id, 'owner', 'Cristian Alarcón', 'cristian@barberiacristian.com', '+34 612 345 678');
                await createProfessional(businessId, existingOwner.id, 'Cristian', 'Fundador y barbero principal', 1);
            }
        } else {
            console.error('   ❌ Error:', ownerAuthErr.message);
        }
    } else {
        console.log(`   ✅ Auth user creado: ${ownerAuth.user.id}`);
        await createBarberiaUser(businessId, ownerAuth.user.id, 'owner', 'Cristian Alarcón', 'cristian@barberiacristian.com', '+34 612 345 678');
        await createProfessional(businessId, ownerAuth.user.id, 'Cristian', 'Fundador y barbero principal', 1);
    }

    // === CREAR PROFESIONAL 1 ===
    console.log('');
    console.log('👤 Creando profesional 1...');

    const { data: pro1Auth, error: pro1AuthErr } = await supabase.auth.admin.createUser({
        email: 'profesional1@barberiacristian.com',
        password: 'Profesional1!',
        email_confirm: true
    });

    if (pro1AuthErr) {
        if (pro1AuthErr.message?.includes('already been registered')) {
            console.log('   ⚠️  El profesional 1 ya existe');
        } else {
            console.error('   ❌ Error:', pro1AuthErr.message);
        }
    } else {
        console.log(`   ✅ Auth user creado: ${pro1Auth.user.id}`);
        await createBarberiaUser(businessId, pro1Auth.user.id, 'professional', 'Carlos López', 'profesional1@barberiacristian.com', '+34 623 456 789');
        await createProfessional(businessId, pro1Auth.user.id, 'Carlos', 'Especialista en cortes modernos', 2);
    }

    // === CREAR PROFESIONAL 2 ===
    console.log('');
    console.log('👤 Creando profesional 2...');

    const { data: pro2Auth, error: pro2AuthErr } = await supabase.auth.admin.createUser({
        email: 'profesional2@barberiacristian.com',
        password: 'Profesional2!',
        email_confirm: true
    });

    if (pro2AuthErr) {
        if (pro2AuthErr.message?.includes('already been registered')) {
            console.log('   ⚠️  El profesional 2 ya existe');
        } else {
            console.error('   ❌ Error:', pro2AuthErr.message);
        }
    } else {
        console.log(`   ✅ Auth user creado: ${pro2Auth.user.id}`);
        await createBarberiaUser(businessId, pro2Auth.user.id, 'professional', 'Miguel García', 'profesional2@barberiacristian.com', '+34 634 567 890');
        await createProfessional(businessId, pro2Auth.user.id, 'Miguel', 'Experto en barbas y afeitados', 3);
    }

    // === ASIGNAR SERVICIOS A PROFESIONALES ===
    console.log('');
    console.log('🔗 Asignando servicios a profesionales...');

    const { data: professionals } = await supabase
        .from('barberia_professionals')
        .select('id')
        .eq('business_id', businessId);

    const { data: services } = await supabase
        .from('barberia_services')
        .select('id')
        .eq('business_id', businessId);

    if (professionals && services) {
        for (const prof of professionals) {
            for (const svc of services) {
                await supabase
                    .from('barberia_professional_services')
                    .upsert({
                        professional_id: prof.id,
                        service_id: svc.id,
                        active: true
                    }, { onConflict: 'professional_id,service_id' });
            }
        }
        console.log(`   ✅ ${professionals.length} profesionales × ${services.length} servicios asignados`);
    }

    // === CREAR HORARIOS DE PROFESIONALES ===
    console.log('');
    console.log('🕐 Creando horarios de profesionales...');

    if (professionals) {
        for (const prof of professionals) {
            for (let day = 1; day <= 6; day++) {
                await supabase
                    .from('barberia_professional_hours')
                    .upsert({
                        professional_id: prof.id,
                        day_of_week: day,
                        start_time: '09:00',
                        end_time: '20:00',
                        is_available: true
                    }, { onConflict: 'professional_id,day_of_week' });
            }
            // Domingo libre
            await supabase
                .from('barberia_professional_hours')
                .upsert({
                    professional_id: prof.id,
                    day_of_week: 0,
                    start_time: '09:00',
                    end_time: '20:00',
                    is_available: false
                }, { onConflict: 'professional_id,day_of_week' });
        }
        console.log('   ✅ Horarios de profesionales configurados (L-S 9:00-20:00)');
    }

    console.log('');
    console.log('=====================================================');
    console.log('  🎉 SEED COMPLETADO');
    console.log('=====================================================');
    console.log('');
    console.log('  📧 Credenciales de acceso:');
    console.log('  ────────────────────────────────────────');
    console.log('  👑 DUEÑO:');
    console.log('     Email:    cristian@barberiacristian.com');
    console.log('     Password: Cristian2026!');
    console.log('');
    console.log('  ✂️  PROFESIONAL 1:');
    console.log('     Email:    profesional1@barberiacristian.com');
    console.log('     Password: Profesional1!');
    console.log('');
    console.log('  ✂️  PROFESIONAL 2:');
    console.log('     Email:    profesional2@barberiacristian.com');
    console.log('     Password: Profesional2!');
    console.log('  ────────────────────────────────────────');
    console.log('');
}

async function createBarberiaUser(businessId, authUserId, role, name, email, phone) {
    const { data, error } = await supabase
        .from('barberia_users')
        .upsert({
            auth_user_id: authUserId,
            business_id: businessId,
            role: role,
            name: name,
            email: email,
            phone: phone,
            active: true
        }, { onConflict: 'auth_user_id,business_id' })
        .select()
        .single();

    if (error) {
        console.error(`   ❌ Error creando barberia_user: ${error.message}`);
    } else {
        console.log(`   ✅ barberia_user creado: ${data.name} (${role})`);
    }
    return data;
}

async function createProfessional(businessId, authUserId, displayName, specialty, sortOrder) {
    // Obtener barberia_user_id
    const { data: user } = await supabase
        .from('barberia_users')
        .select('id')
        .eq('auth_user_id', authUserId)
        .eq('business_id', businessId)
        .single();

    if (!user) return;

    const { data, error } = await supabase
        .from('barberia_professionals')
        .upsert({
            user_id: user.id,
            business_id: businessId,
            display_name: displayName,
            specialty: specialty,
            sort_order: sortOrder,
            active: true
        }, { onConflict: 'user_id' })
        .select()
        .single();

    if (error) {
        // Si no existe constraint unique en user_id, insertar directamente
        if (error.code === '42P10') {
            const { data: inserted, error: insertErr } = await supabase
                .from('barberia_professionals')
                .insert({
                    user_id: user.id,
                    business_id: businessId,
                    display_name: displayName,
                    specialty: specialty,
                    sort_order: sortOrder,
                    active: true
                })
                .select()
                .single();
            if (!insertErr) {
                console.log(`   ✅ Profesional creado: ${displayName}`);
            } else {
                console.error(`   ❌ Error creando profesional: ${insertErr.message}`);
            }
        } else {
            console.error(`   ❌ Error creando profesional: ${error.message}`);
        }
    } else {
        console.log(`   ✅ Profesional creado: ${displayName}`);
    }
}

seed().catch(console.error);
