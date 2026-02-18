-- Solo lo que falta: copiar profesionales y servicios

-- Copiar profesionales al tenant reservabarbero
INSERT INTO barber_professionals (name, photo_url, is_active, priority, tenant_id)
SELECT name, photo_url, is_active, priority, 
       (SELECT id FROM tenants WHERE slug = 'reservabarbero')
FROM barber_professionals
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'barberiacristianalarcon');

-- Copiar servicios al tenant reservabarbero
INSERT INTO barber_services (name, price, duration_min, is_active, tenant_id)
SELECT name, price, duration_min, is_active,
       (SELECT id FROM tenants WHERE slug = 'reservabarbero')
FROM barber_services
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'barberiacristianalarcon');
