-- Ejecutar ANTES de importar los CSVs
-- Solo añade las columnas nuevas a la tabla tenants
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
