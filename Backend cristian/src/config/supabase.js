/**
 * Configuración de Supabase
 * - supabase: cliente con anon key (para operaciones públicas respetando RLS)
 * - supabaseAdmin: cliente con service role key (bypass RLS, solo para backend)
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ SUPABASE_URL y SUPABASE_ANON_KEY son requeridos');
    process.exit(1);
}

// Cliente público (respeta RLS)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente admin (bypass RLS - solo para operaciones del backend)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

module.exports = { supabase, supabaseAdmin };
