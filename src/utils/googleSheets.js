export async function syncToGoogleSheets(data, tenant) {
    // URL DEFINITIVA proporcionada por el usuario - Esta es la que funciona
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwRHpwizBuFSsrTbsb5mWXaT938nN4oIcNOwR-kA8rh_GBIr1PCt1z60XsjsCZUIFrd/exec';

    // Preparar datos con todos los campos necesarios para el script de Google
    const fullData = {
        fecha_registro: data.fecha_registro,
        fecha_cita: data.fecha_cita,
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        estado: data.estado,
        servicio: data.servicio,
        profesional: data.profesional,
        barberia_nombre: tenant?.name || 'Barbería',
        barberia_id: tenant?.id,
        barberia_slug: tenant?.slug || 'barberia',
        barberia_direccion: tenant?.address || '',
        barberia_ciudad: tenant?.city || '',
        admin_email: 'turjemanmlevi@gmail.com'
    };

    console.log('📡 [googleSheets] Enviando a Google:', fullData);

    try {
        // Usamos fetch con no-cors porque Google Apps Script no permite CORS directo
        // pero procesa el POST correctamente.
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(fullData),
            keepalive: true
        });

        console.log('✅ [googleSheets] Sincronización exitosa (enviado)');
        return true;
    } catch (error) {
        console.error('❌ [googleSheets] ERROR:', error);
        return false;
    }
}
