export async function syncToGoogleSheets(data) {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyGB-2o_HEVgGQMSfX9v6CaABE9ZrEHiJZwf2-BULDgXK6YFPLD-Ig2ANdqTu0MAfld/exec'

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
