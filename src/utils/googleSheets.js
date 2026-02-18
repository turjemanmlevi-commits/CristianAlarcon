export async function syncToGoogleSheets(data) {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxjRjo9e7nXHjiN1fZPGnfbRi1EuyPEE2exWG3PxZLrM9I0GwhLreAQ6VJvnv2T9bky/exec'

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
