---
description: How to add a new barbershop (tenant/subdomain) to ReservaBarbero
---

# Añadir una nueva barbería (subdomain) a ReservaBarbero

## Arquitectura

La app usa un modelo **multi-tenant**:
- `reservabarbero.com` → Landing page de la plataforma (independiente)
- `barberiacristianalarcon.reservabarbero.com` → Barbería de Cristian
- `nuevabarberia.reservabarbero.com` → Nueva barbería

Cada subdomain carga su propio tenant desde la base de datos, con sus propios:
- Servicios, profesionales, precios, fotos
- Logo, colores, redes sociales, WhatsApp
- Horarios de apertura/cierre
- Dirección y Google Maps link

## Paso 1: Crear el tenant en Supabase

Ejecuta este SQL en Supabase SQL Editor (Dashboard → SQL Editor):

```sql
INSERT INTO tenants (
  slug,
  name,
  logo_url,
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
  admin_email,
  google_sheets_url
) VALUES (
  'nuevabarberia',                    -- slug = subdominio (nuevabarberia.reservabarbero.com)
  'Nueva Barbería',                   -- nombre que se muestra
  'https://example.com/logo.png',     -- URL del logo (puede ser null)
  '#D4AF37',                          -- color tema (hex)
  'Calle Ejemplo 123',               -- dirección
  'Málaga',                           -- ciudad
  'https://maps.google.com/...',     -- enlace Google Maps
  '34600000000',                      -- WhatsApp (con prefijo país)
  '600 00 00 00',                     -- WhatsApp (formato display)
  'https://www.instagram.com/nuevabarberia/',  -- Instagram
  'Lunes - Sábado',                   -- días de apertura
  '10:00 - 20:00',                    -- horario display
  10,                                  -- hora apertura (número)
  0,                                   -- minuto apertura
  20,                                  -- hora cierre (número)
  0,                                   -- minuto cierre
  'admin@nuevabarberia.com',          -- email admin (para notificaciones)
  'https://script.google.com/...'     -- URL Google Apps Script (opcional)
);
```

## Paso 2: Añadir los profesionales (barberos)

```sql
INSERT INTO barber_professionals (name, photo_url, is_active, priority, tenant_id)
VALUES 
  ('Nombre Barbero 1', 'https://example.com/barbero1.jpg', true, 1, (SELECT id FROM tenants WHERE slug = 'nuevabarberia')),
  ('Nombre Barbero 2', 'https://example.com/barbero2.jpg', true, 2, (SELECT id FROM tenants WHERE slug = 'nuevabarberia'));
```

> **IMPORTANTE**: Las fotos de los barberos se guardan en `photo_url`. Puedes subir las imágenes a Supabase Storage o usar cualquier URL pública.

## Paso 3: Añadir los servicios

```sql
INSERT INTO barber_services (name, price, duration_min, is_active, tenant_id)
VALUES 
  ('Corte Tradicional', 15.00, 30, true, (SELECT id FROM tenants WHERE slug = 'nuevabarberia')),
  ('Arreglo de Barba', 10.00, 20, true, (SELECT id FROM tenants WHERE slug = 'nuevabarberia')),
  ('Corte y Barba', 22.00, 45, true, (SELECT id FROM tenants WHERE slug = 'nuevabarberia'));
```

## Paso 4: Configurar el subdominio en Vercel

1. Ve a **Vercel Dashboard** → tu proyecto
2. Ve a **Settings** → **Domains**
3. Añade: `nuevabarberia.reservabarbero.com`
4. Vercel te dirá qué DNS record crear

## Paso 5: Configurar DNS en tu proveedor de dominio

Añade un registro **CNAME** en tu proveedor de dominio:
- **Tipo**: CNAME
- **Nombre**: `nuevabarberia` (o `*.reservabarbero.com` si quieres wildcard)
- **Valor**: `cname.vercel-dns.com`

> **TIP**: Si configuras un **wildcard** (`*.reservabarbero.com`) apuntando a Vercel, cualquier nuevo subdominio funcionará automáticamente sin tocar DNS de nuevo. Solo necesitarás añadir el dominio en Vercel.

## Paso 6: Configurar Google OAuth (si usas login con Google)

1. Ve a **Google Cloud Console** → APIs & Services → Credentials
2. En tu **OAuth Client**, añade a "Authorized redirect URIs":
   - `https://nuevabarberia.reservabarbero.com`
3. En **Supabase Dashboard** → Authentication → URL Configuration:
   - Añade `https://nuevabarberia.reservabarbero.com` a "Redirect URLs"

## Verificación

1. Visita `https://nuevabarberia.reservabarbero.com`
2. Deberías ver el logo, nombre, servicios y profesionales configurados
3. Verifica que `https://reservabarbero.com` sigue mostrando la landing page independiente

## Campos de la tabla `tenants` (referencia)

| Campo | Tipo | Descripción |
|---|---|---|
| `slug` | text | Identificador del subdominio (ej: `barberiacristianalarcon`) |
| `name` | text | Nombre visible de la barbería |
| `logo_url` | text | URL del logo |
| `theme_color` | text | Color principal (hex, ej: `#D4AF37`) |
| `address` | text | Dirección completa |
| `city` | text | Ciudad |
| `google_maps_url` | text | URL de Google Maps |
| `whatsapp` | text | Número WhatsApp con prefijo (ej: `34678528755`) |
| `whatsapp_display` | text | Número formateado para mostrar (ej: `678 52 87 55`) |
| `instagram_url` | text | URL Instagram |
| `schedule_days` | text | Texto de días (ej: `Lunes - Sábado`) |
| `schedule_hours` | text | Texto de horario (ej: `10:00 - 20:00`) |
| `open_hour` | int | Hora de apertura (0-23) |
| `open_min` | int | Minuto de apertura (0-59) |
| `close_hour` | int | Hora de cierre (0-23) |
| `close_min` | int | Minuto de cierre (0-59) |
| `admin_email` | text | Email del admin/propietario |
| `google_sheets_url` | text | URL Google Apps Script para sincronización |
