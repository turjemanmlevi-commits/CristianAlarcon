-- ==========================================
-- PASO 1: Añadir columnas nuevas
-- ==========================================
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS whatsapp_display text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS schedule_days text DEFAULT 'Lunes - Sábado';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS schedule_hours text DEFAULT '10:00 - 20:00';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS open_hour integer DEFAULT 10;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS open_min integer DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS close_hour integer DEFAULT 20;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS close_min integer DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS admin_email text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS google_sheets_url text;

-- ==========================================
-- PASO 2: Rellenar TODOS los datos de Cristian (name estaba vacío)
-- ==========================================
UPDATE tenants 
SET 
  name = 'Barbería Cristian Alarcón',
  address = 'C. Buganvillas, 39, Local 7',
  city = '29651 Las Lagunas de Mijas, Málaga',
  google_maps_url = 'https://maps.app.goo.gl/barberiacristianalarcon',
  whatsapp = '34678528755',
  whatsapp_display = '678 52 87 55',
  instagram_url = 'https://www.instagram.com/barberiacristianalarcon/',
  schedule_days = 'Lunes - Sábado',
  schedule_hours = '10:00 - 19:30',
  open_hour = 10,
  open_min = 0,
  close_hour = 20,
  close_min = 1,
  admin_email = 'leviturjeman@gmail.com'
WHERE slug = 'barberiacristianalarcon';

-- ==========================================
-- PASO 3: Crear tenant reservabarbero (copia de Cristian)
-- ==========================================
INSERT INTO tenants (
  slug, name, theme_color, logo_url,
  address, city, google_maps_url,
  whatsapp, whatsapp_display, instagram_url,
  schedule_days, schedule_hours,
  open_hour, open_min, close_hour, close_min,
  admin_email
)
VALUES (
  'reservabarbero',
  'Reserva Barbero',
  '#D4AF37',
  NULL,
  'C. Buganvillas, 39, Local 7',
  '29651 Las Lagunas de Mijas, Málaga',
  'https://maps.app.goo.gl/barberiacristianalarcon',
  '34678528755',
  '678 52 87 55',
  'https://www.instagram.com/barberiacristianalarcon/',
  'Lunes - Sábado',
  '10:00 - 19:30',
  10, 0, 20, 1,
  'leviturjeman@gmail.com'
)
ON CONFLICT (slug) DO NOTHING;

-- ==========================================
-- PASO 4: Copiar profesionales al tenant reservabarbero
-- ==========================================
INSERT INTO barber_professionals (name, photo_url, is_active, priority, tenant_id)
SELECT name, photo_url, is_active, priority, 
       (SELECT id FROM tenants WHERE slug = 'reservabarbero')
FROM barber_professionals
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'barberiacristianalarcon');

-- ==========================================
-- PASO 5: Copiar servicios al tenant reservabarbero
-- ==========================================
INSERT INTO barber_services (name, price, duration_min, is_active, tenant_id)
SELECT name, price, duration_min, is_active,
       (SELECT id FROM tenants WHERE slug = 'reservabarbero')
FROM barber_services
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'barberiacristianalarcon');
