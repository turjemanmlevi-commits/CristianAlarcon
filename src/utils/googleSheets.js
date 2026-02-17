export async function syncToGoogleSheets(data) {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzeu5CLDafa9ahtlK2wR9ZsbbPcNu44bGGR7xFlEFL4Qxsq9eDgke8c1MWo1K30wI0X/exec'

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
