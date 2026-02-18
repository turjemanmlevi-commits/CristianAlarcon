-- ==========================================
-- SQL para añadir los campos nuevos a la tabla tenants
-- Ejecutar en Supabase SQL Editor
-- ==========================================

-- Nuevos campos para la configuración de cada barbería
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
-- Actualizar el tenant de Cristian con sus datos actuales
-- ==========================================
UPDATE tenants 
SET 
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
-- Crear el tenant de ReservaBarbero (plantilla del dominio principal)
-- ESTE ES EL TENANT QUE CARGA reservabarbero.com
-- ==========================================
INSERT INTO tenants (
  slug, name, theme_color,
  address, city, google_maps_url,
  whatsapp, whatsapp_display, instagram_url,
  schedule_days, schedule_hours,
  open_hour, open_min, close_hour, close_min,
  admin_email
)
SELECT
  'reservabarbero',
  name,
  theme_color,
  address,
  city,
  google_maps_url,
  whatsapp,
  whatsapp_display,
  instagram_url,
  schedule_days,
  schedule_hours,
  open_hour,
  open_min,
  close_hour,
  close_min,
  admin_email
FROM tenants
WHERE slug = 'barberiacristianalarcon'
ON CONFLICT (slug) DO NOTHING;

-- ==========================================
-- Copiar los profesionales de Cristian al tenant reservabarbero
-- ==========================================
INSERT INTO barber_professionals (name, photo_url, is_active, priority, tenant_id)
SELECT name, photo_url, is_active, priority, 
       (SELECT id FROM tenants WHERE slug = 'reservabarbero')
FROM barber_professionals
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'barberiacristianalarcon');

-- ==========================================
-- Copiar los servicios de Cristian al tenant reservabarbero
-- ==========================================
INSERT INTO barber_services (name, price, duration_min, is_active, tenant_id)
SELECT name, price, duration_min, is_active,
       (SELECT id FROM tenants WHERE slug = 'reservabarbero')
FROM barber_services
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'barberiacristianalarcon');
