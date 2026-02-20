-- =====================================================
-- BARBERÍA CRISTIAN - MIGRACIÓN COMPLETA
-- =====================================================
-- Ejecutar en: https://supabase.com/dashboard/project/nzeblijzontrmizefssh/sql/new
-- =====================================================

-- =====================================================
-- 1. TABLAS CORE
-- =====================================================

CREATE TABLE IF NOT EXISTS barberia_businesses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  timezone VARCHAR(50) DEFAULT 'Europe/Madrid',
  logo_url TEXT,
  theme_color VARCHAR(7) DEFAULT '#000000',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TYPE barberia_user_role AS ENUM ('owner', 'professional');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS barberia_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id INTEGER REFERENCES barberia_businesses(id) ON DELETE CASCADE,
  role barberia_user_role NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(auth_user_id, business_id)
);

CREATE TABLE IF NOT EXISTS barberia_professionals (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES barberia_users(id) ON DELETE CASCADE,
  business_id INTEGER REFERENCES barberia_businesses(id) ON DELETE CASCADE,
  display_name VARCHAR(255) NOT NULL,
  specialty TEXT,
  photo_url TEXT,
  bio TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS barberia_services (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES barberia_businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  buffer_before_minutes INTEGER DEFAULT 0,
  buffer_after_minutes INTEGER DEFAULT 5,
  color VARCHAR(7) DEFAULT '#FFD700',
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS barberia_professional_services (
  id SERIAL PRIMARY KEY,
  professional_id INTEGER REFERENCES barberia_professionals(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES barberia_services(id) ON DELETE CASCADE,
  custom_price DECIMAL(10,2),
  custom_duration_minutes INTEGER,
  active BOOLEAN DEFAULT true,
  UNIQUE(professional_id, service_id)
);

-- =====================================================
-- 2. HORARIOS Y BLOQUEOS
-- =====================================================

CREATE TABLE IF NOT EXISTS barberia_business_hours (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES barberia_businesses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS barberia_professional_hours (
  id SERIAL PRIMARY KEY,
  professional_id INTEGER REFERENCES barberia_professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(professional_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS barberia_time_blocks (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES barberia_businesses(id) ON DELETE CASCADE,
  professional_id INTEGER REFERENCES barberia_professionals(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'Bloqueado',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT,
  reason TEXT,
  created_by UUID REFERENCES barberia_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. CLIENTES
-- =====================================================

CREATE TABLE IF NOT EXISTS barberia_clients (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES barberia_businesses(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  notes TEXT,
  total_visits INTEGER DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, phone)
);

-- =====================================================
-- 4. CITAS (CORE - con control de concurrencia)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE barberia_appointment_status AS ENUM ('PENDING','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS barberia_appointments (
  id SERIAL PRIMARY KEY,
  business_id INTEGER NOT NULL REFERENCES barberia_businesses(id) ON DELETE CASCADE,
  professional_id INTEGER NOT NULL REFERENCES barberia_professionals(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES barberia_services(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES barberia_clients(id) ON DELETE SET NULL,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status barberia_appointment_status DEFAULT 'CONFIRMED',
  notes TEXT,
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50) NOT NULL,
  client_email VARCHAR(255),
  price DECIMAL(10,2),
  created_by UUID REFERENCES barberia_users(id),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES barberia_users(id),
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_professional_slot UNIQUE (professional_id, start_at)
);

-- =====================================================
-- 5. SLOT HOLDS (reservas temporales, TTL 2 min)
-- =====================================================

CREATE TABLE IF NOT EXISTS barberia_slot_holds (
  id VARCHAR(50) PRIMARY KEY DEFAULT ('hld_' || gen_random_uuid()::text),
  business_id INTEGER NOT NULL REFERENCES barberia_businesses(id) ON DELETE CASCADE,
  professional_id INTEGER NOT NULL REFERENCES barberia_professionals(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES barberia_services(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '2 minutes'),
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_hold_slot UNIQUE (professional_id, start_at)
);

-- =====================================================
-- 6. AUDIT LOG & SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS barberia_audit_log (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES barberia_businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES barberia_users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS barberia_settings (
  id SERIAL PRIMARY KEY,
  business_id INTEGER UNIQUE REFERENCES barberia_businesses(id) ON DELETE CASCADE,
  slot_interval_minutes INTEGER DEFAULT 30,
  max_advance_booking_days INTEGER DEFAULT 30,
  min_advance_booking_hours INTEGER DEFAULT 1,
  allow_online_booking BOOLEAN DEFAULT true,
  require_client_phone BOOLEAN DEFAULT true,
  require_client_email BOOLEAN DEFAULT false,
  auto_confirm_appointments BOOLEAN DEFAULT true,
  send_email_notifications BOOLEAN DEFAULT true,
  send_sms_notifications BOOLEAN DEFAULT false,
  cancellation_policy_hours INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bc_appointments_business ON barberia_appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_bc_appointments_professional ON barberia_appointments(professional_id);
CREATE INDEX IF NOT EXISTS idx_bc_appointments_date ON barberia_appointments(start_at);
CREATE INDEX IF NOT EXISTS idx_bc_appointments_status ON barberia_appointments(status);
CREATE INDEX IF NOT EXISTS idx_bc_appointments_client ON barberia_appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_bc_slot_holds_expires ON barberia_slot_holds(expires_at);
CREATE INDEX IF NOT EXISTS idx_bc_clients_business ON barberia_clients(business_id);
CREATE INDEX IF NOT EXISTS idx_bc_users_auth ON barberia_users(auth_user_id);

-- =====================================================
-- 8. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE barberia_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE barberia_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE barberia_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE barberia_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barberia_professional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barberia_business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE barberia_professional_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE barberia_time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE barberia_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE barberia_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE barberia_slot_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE barberia_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE barberia_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
DO $$ BEGIN CREATE POLICY "bc_businesses_public_read" ON barberia_businesses FOR SELECT USING (active = true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "bc_services_public_read" ON barberia_services FOR SELECT USING (active = true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "bc_professionals_public_read" ON barberia_professionals FOR SELECT USING (active = true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "bc_business_hours_public_read" ON barberia_business_hours FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "bc_prof_hours_public_read" ON barberia_professional_hours FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "bc_prof_services_public_read" ON barberia_professional_services FOR SELECT USING (active = true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "bc_settings_select" ON barberia_settings FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "bc_time_blocks_select" ON barberia_time_blocks FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Políticas de inserción pública (para clientes creando citas)
DO $$ BEGIN CREATE POLICY "bc_appointments_insert" ON barberia_appointments FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "bc_slot_holds_insert" ON barberia_slot_holds FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "bc_slot_holds_select" ON barberia_slot_holds FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "bc_clients_insert" ON barberia_clients FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "bc_audit_log_insert" ON barberia_audit_log FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- 9. FUNCIONES DE NEGOCIO
-- =====================================================

-- Limpiar holds expirados
CREATE OR REPLACE FUNCTION barberia_cleanup_expired_holds() RETURNS void AS $$
BEGIN
  DELETE FROM barberia_slot_holds WHERE expires_at < NOW() AND used = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtener slots disponibles
CREATE OR REPLACE FUNCTION barberia_get_available_slots(
  p_business_id INTEGER,
  p_service_id INTEGER,
  p_professional_id INTEGER,
  p_date DATE
) RETURNS TABLE(slot_time TIMESTAMPTZ) AS $$
DECLARE
  v_day_of_week INTEGER;
  v_open_time TIME;
  v_close_time TIME;
  v_duration INTEGER;
  v_buffer_before INTEGER;
  v_buffer_after INTEGER;
  v_interval INTEGER;
  v_timezone VARCHAR(50);
  v_current_time TIME;
  v_slot_start TIMESTAMPTZ;
  v_slot_end TIMESTAMPTZ;
BEGIN
  -- Limpiar holds expirados
  PERFORM barberia_cleanup_expired_holds();

  -- Obtener timezone
  SELECT timezone INTO v_timezone FROM barberia_businesses WHERE id = p_business_id;
  IF v_timezone IS NULL THEN v_timezone := 'Europe/Madrid'; END IF;

  -- Día de la semana
  v_day_of_week := EXTRACT(DOW FROM p_date);

  -- Duración del servicio
  SELECT COALESCE(ps.custom_duration_minutes, s.duration_minutes),
         s.buffer_before_minutes,
         s.buffer_after_minutes
  INTO v_duration, v_buffer_before, v_buffer_after
  FROM barberia_services s
  LEFT JOIN barberia_professional_services ps ON ps.service_id = s.id AND ps.professional_id = p_professional_id
  WHERE s.id = p_service_id AND s.active = true;

  IF v_duration IS NULL THEN RETURN; END IF;

  -- Intervalo de slots
  SELECT COALESCE(slot_interval_minutes, 30) INTO v_interval
  FROM barberia_settings WHERE business_id = p_business_id;
  IF v_interval IS NULL THEN v_interval := 30; END IF;

  -- Horario del profesional (o del negocio como fallback)
  SELECT start_time, end_time INTO v_open_time, v_close_time
  FROM barberia_professional_hours
  WHERE professional_id = p_professional_id AND day_of_week = v_day_of_week AND is_available = true;

  IF v_open_time IS NULL THEN
    SELECT open_time, close_time INTO v_open_time, v_close_time
    FROM barberia_business_hours
    WHERE business_id = p_business_id AND day_of_week = v_day_of_week AND is_closed = false;
  END IF;

  IF v_open_time IS NULL THEN RETURN; END IF;

  -- Generar slots
  v_current_time := v_open_time;
  WHILE v_current_time + (v_duration || ' minutes')::INTERVAL <= v_close_time LOOP
    v_slot_start := (p_date || ' ' || v_current_time)::TIMESTAMP AT TIME ZONE v_timezone;
    v_slot_end := v_slot_start + (v_duration || ' minutes')::INTERVAL;

    -- Solo slots futuros (al menos 1 hora de anticipación)
    IF v_slot_start > (NOW() + INTERVAL '1 hour') THEN
      -- No colisiona con citas existentes
      IF NOT EXISTS (
        SELECT 1 FROM barberia_appointments
        WHERE professional_id = p_professional_id
        AND status NOT IN ('CANCELLED','NO_SHOW')
        AND (start_at - (v_buffer_before || ' minutes')::INTERVAL) < v_slot_end
        AND (end_at + (v_buffer_after || ' minutes')::INTERVAL) > v_slot_start
      ) THEN
        -- No colisiona con bloqueos
        IF NOT EXISTS (
          SELECT 1 FROM barberia_time_blocks
          WHERE (professional_id = p_professional_id OR (professional_id IS NULL AND business_id = p_business_id))
          AND start_at < v_slot_end AND end_at > v_slot_start
        ) THEN
          -- No tiene hold activo
          IF NOT EXISTS (
            SELECT 1 FROM barberia_slot_holds
            WHERE professional_id = p_professional_id
            AND start_at = v_slot_start
            AND expires_at > NOW() AND used = false
          ) THEN
            slot_time := v_slot_start;
            RETURN NEXT;
          END IF;
        END IF;
      END IF;
    END IF;

    v_current_time := v_current_time + (v_interval || ' minutes')::INTERVAL;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear slot hold temporal
CREATE OR REPLACE FUNCTION barberia_create_slot_hold(
  p_business_id INTEGER,
  p_service_id INTEGER,
  p_professional_id INTEGER,
  p_start_at TIMESTAMPTZ
) RETURNS TABLE(hold_id VARCHAR(50), expires_at TIMESTAMPTZ) AS $$
DECLARE
  v_hold_id VARCHAR(50);
  v_expires TIMESTAMPTZ;
BEGIN
  PERFORM barberia_cleanup_expired_holds();
  v_hold_id := 'hld_' || gen_random_uuid()::text;
  v_expires := NOW() + INTERVAL '2 minutes';

  INSERT INTO barberia_slot_holds (id, business_id, professional_id, service_id, start_at, expires_at)
  VALUES (v_hold_id, p_business_id, p_professional_id, p_service_id, p_start_at, v_expires);

  hold_id := v_hold_id;
  expires_at := v_expires;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear cita con control de concurrencia
CREATE OR REPLACE FUNCTION barberia_create_appointment(
  p_business_id INTEGER,
  p_service_id INTEGER,
  p_professional_id INTEGER,
  p_start_at TIMESTAMPTZ,
  p_client_name VARCHAR(255),
  p_client_phone VARCHAR(50),
  p_client_email VARCHAR(255) DEFAULT NULL,
  p_hold_id VARCHAR(50) DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS TABLE(
  appointment_id INTEGER,
  status barberia_appointment_status,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  error_code VARCHAR(50),
  error_message TEXT
) AS $$
DECLARE
  v_duration INTEGER;
  v_end_at TIMESTAMPTZ;
  v_client_id INTEGER;
  v_appointment_id INTEGER;
  v_price DECIMAL(10,2);
BEGIN
  PERFORM barberia_cleanup_expired_holds();

  -- Obtener duración y precio del servicio
  SELECT COALESCE(ps.custom_duration_minutes, s.duration_minutes),
         COALESCE(ps.custom_price, s.price)
  INTO v_duration, v_price
  FROM barberia_services s
  LEFT JOIN barberia_professional_services ps ON ps.service_id = s.id AND ps.professional_id = p_professional_id
  WHERE s.id = p_service_id AND s.active = true;

  IF v_duration IS NULL THEN
    error_code := 'SERVICE_NOT_FOUND';
    error_message := 'El servicio no existe.';
    RETURN NEXT; RETURN;
  END IF;

  v_end_at := p_start_at + (v_duration || ' minutes')::INTERVAL;

  -- Verificar hold si existe
  IF p_hold_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM barberia_slot_holds
      WHERE id = p_hold_id AND professional_id = p_professional_id
      AND start_at = p_start_at AND expires_at > NOW() AND used = false
    ) THEN
      error_code := 'HOLD_EXPIRED';
      error_message := 'La reserva temporal ha expirado.';
      RETURN NEXT; RETURN;
    END IF;
  END IF;

  -- Verificar disponibilidad
  IF EXISTS (
    SELECT 1 FROM barberia_appointments
    WHERE professional_id = p_professional_id
    AND status NOT IN ('CANCELLED','NO_SHOW')
    AND start_at = p_start_at
  ) THEN
    error_code := 'SLOT_UNAVAILABLE';
    error_message := 'El horario seleccionado ya no está disponible.';
    RETURN NEXT; RETURN;
  END IF;

  -- Crear o actualizar cliente
  INSERT INTO barberia_clients (business_id, name, email, phone)
  VALUES (p_business_id, p_client_name, p_client_email, p_client_phone)
  ON CONFLICT (business_id, phone)
  DO UPDATE SET name = EXCLUDED.name, email = COALESCE(EXCLUDED.email, barberia_clients.email)
  RETURNING id INTO v_client_id;

  -- Crear cita
  INSERT INTO barberia_appointments (
    business_id, professional_id, service_id, client_id,
    start_at, end_at, client_name, client_phone, client_email,
    price, notes, status
  ) VALUES (
    p_business_id, p_professional_id, p_service_id, v_client_id,
    p_start_at, v_end_at, p_client_name, p_client_phone, p_client_email,
    v_price, p_notes, 'CONFIRMED'
  ) RETURNING id INTO v_appointment_id;

  -- Marcar hold como usado
  IF p_hold_id IS NOT NULL THEN
    UPDATE barberia_slot_holds SET used = true WHERE id = p_hold_id;
  END IF;

  -- Actualizar visitas del cliente
  UPDATE barberia_clients SET total_visits = total_visits + 1, last_visit_at = NOW()
  WHERE id = v_client_id;

  appointment_id := v_appointment_id;
  status := 'CONFIRMED';
  start_time := p_start_at;
  end_time := v_end_at;
  error_code := NULL;
  error_message := NULL;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. TRIGGERS AUTO-UPDATE TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION barberia_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bc_businesses_ts ON barberia_businesses;
CREATE TRIGGER update_bc_businesses_ts BEFORE UPDATE ON barberia_businesses FOR EACH ROW EXECUTE FUNCTION barberia_update_timestamp();

DROP TRIGGER IF EXISTS update_bc_users_ts ON barberia_users;
CREATE TRIGGER update_bc_users_ts BEFORE UPDATE ON barberia_users FOR EACH ROW EXECUTE FUNCTION barberia_update_timestamp();

DROP TRIGGER IF EXISTS update_bc_professionals_ts ON barberia_professionals;
CREATE TRIGGER update_bc_professionals_ts BEFORE UPDATE ON barberia_professionals FOR EACH ROW EXECUTE FUNCTION barberia_update_timestamp();

DROP TRIGGER IF EXISTS update_bc_services_ts ON barberia_services;
CREATE TRIGGER update_bc_services_ts BEFORE UPDATE ON barberia_services FOR EACH ROW EXECUTE FUNCTION barberia_update_timestamp();

DROP TRIGGER IF EXISTS update_bc_appointments_ts ON barberia_appointments;
CREATE TRIGGER update_bc_appointments_ts BEFORE UPDATE ON barberia_appointments FOR EACH ROW EXECUTE FUNCTION barberia_update_timestamp();

DROP TRIGGER IF EXISTS update_bc_clients_ts ON barberia_clients;
CREATE TRIGGER update_bc_clients_ts BEFORE UPDATE ON barberia_clients FOR EACH ROW EXECUTE FUNCTION barberia_update_timestamp();

DROP TRIGGER IF EXISTS update_bc_settings_ts ON barberia_settings;
CREATE TRIGGER update_bc_settings_ts BEFORE UPDATE ON barberia_settings FOR EACH ROW EXECUTE FUNCTION barberia_update_timestamp();

-- =====================================================
-- 11. SEED DATA
-- =====================================================

-- Negocio
INSERT INTO barberia_businesses (name, slug, address, phone, email, timezone, theme_color)
VALUES ('Barbería Cristian', 'barberia-cristian', 'Calle Principal 123, Madrid', '+34 612 345 678', 'info@barberiacristian.com', 'Europe/Madrid', '#000000')
ON CONFLICT (slug) DO NOTHING;

-- Configuración
INSERT INTO barberia_settings (business_id, slot_interval_minutes, max_advance_booking_days, min_advance_booking_hours, allow_online_booking, auto_confirm_appointments)
SELECT id, 30, 30, 1, true, true
FROM barberia_businesses WHERE slug = 'barberia-cristian'
ON CONFLICT (business_id) DO NOTHING;

-- Horarios del negocio
DO $$
DECLARE v_bid INTEGER;
BEGIN
  SELECT id INTO v_bid FROM barberia_businesses WHERE slug = 'barberia-cristian';
  INSERT INTO barberia_business_hours (business_id, day_of_week, open_time, close_time, is_closed)
  VALUES (v_bid, 0, '09:00'::TIME, '20:00'::TIME, true) ON CONFLICT DO NOTHING;
  FOR i IN 1..6 LOOP
    INSERT INTO barberia_business_hours (business_id, day_of_week, open_time, close_time, is_closed)
    VALUES (v_bid, i, '09:00'::TIME, '20:00'::TIME, false) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Servicios
DO $$
DECLARE v_bid INTEGER;
BEGIN
  SELECT id INTO v_bid FROM barberia_businesses WHERE slug = 'barberia-cristian';
  INSERT INTO barberia_services (business_id, name, description, duration_minutes, price, buffer_after_minutes, color, sort_order) VALUES
    (v_bid, 'Corte de pelo', 'Corte clásico o moderno con acabado profesional', 30, 15.00, 5, '#FFD700', 1),
    (v_bid, 'Corte + Barba', 'Corte de pelo con arreglo y perfilado de barba', 45, 22.00, 5, '#FF6B35', 2),
    (v_bid, 'Arreglo de barba', 'Recorte, perfilado y diseño de barba', 20, 10.00, 5, '#4ECDC4', 3),
    (v_bid, 'Afeitado clásico', 'Afeitado con navaja y toalla caliente', 30, 12.00, 5, '#A8E6CF', 4),
    (v_bid, 'Tinte', 'Aplicación de color profesional', 60, 25.00, 10, '#FF8A80', 5),
    (v_bid, 'Tratamiento capilar', 'Hidratación y nutrición del cabello', 45, 20.00, 5, '#B388FF', 6);
END $$;

-- =====================================================
-- ✅ MIGRACIÓN COMPLETADA
-- =====================================================
