export async function syncToGoogleSheets(data, tenant) {
    // Solo sincronizar si el tenant tiene una URL de Google Sheets configurada
    const SCRIPT_URL = tenant?.google_sheets_url

    if (!SCRIPT_URL) return;

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(data),
            keepalive: true
        });
    } catch (error) {
        console.error('Error syncing to Google:', error);
    }
}
