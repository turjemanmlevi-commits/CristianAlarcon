export const getSubdomain = () => {
    const hostname = window.location.hostname
    const parts = hostname.split('.')

    // Si estamos en localhost y hay más de 1 parte
    if (hostname.endsWith('localhost')) {
        return parts.length > 1 ? parts[0] : null
    }

    // Caso especial para Vercel: si la URL contiene .vercel.app
    if (hostname.includes('.vercel.app')) {
        // Si hay más de 2 partes antes de vercel.app, la primera es el subdominio
        // Pero en Vercel los nombres a veces son complejos. 
        // Solo extraemos si hay algo puntual antes de la estructura base.
        if (parts.length > 3) return parts[0]
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
