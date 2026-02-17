export const getSubdomain = () => {
    const hostname = window.location.hostname
    const parts = hostname.split('.')

    // Si estamos en localhost y hay más de 1 parte
    if (hostname.endsWith('localhost')) {
        return parts.length > 1 ? parts[0] : null
    }

    // Caso especial para Vercel: si la URL contiene .vercel.app
    if (hostname.includes('.vercel.app')) {
        // parts: [subdomain, vercel, app] -> length 3
        // parts: [subdomain, project, vercel, app] -> length 4
        if (parts.length >= 3) {
            const sub = parts[0]
            if (sub !== 'www' && sub !== 'cristian-alarcon') return sub
        }
        return null
    }

    // Filtramos 'www' si existe
    const filteredParts = parts.filter(part => part !== 'www')

    // Si estamos en reservabarbero.com (2 partes) o similar
    // Ejemplo: barberia.reservabarbero.com -> Parts: [barberia, reservabarbero, com]
    if (filteredParts.length >= 3) {
        return filteredParts[0]
    }

    return null
}
