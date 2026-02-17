export async function syncToGoogleSheets(data) {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbypflJFP_czrZ-5tUpOn8HGQhxhvYO0Y91fSIRIKEAROzi8YspD_ESwn--nhsD1oE40/exec'

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
