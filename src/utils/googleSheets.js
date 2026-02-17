export async function syncToGoogleSheets(data) {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxhdhZnzw9dsDkVCpntvV4KjLOXWLuz-Fe8cCv6Zny2DypGNdsbDc-7k3AGZUUscchh/exec'

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
