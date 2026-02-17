export const getSubdomain = () => {
    const hostname = window.location.hostname
    const parts = hostname.split('.')

    // Si estamos en localhost y hay más de 1 parte
    if (hostname.endsWith('localhost')) {
        return parts.length > 1 ? parts[0] : null
    }

    // Filtramos 'www' si existe
    const filteredParts = parts.filter(part => part !== 'www')

    // Si después de filtrar quedan más de 2 partes (ej: cristian.reservabarbero.com)
    // o si el dominio principal es algo como 'reservabarbero.com' (quedan 2 partes)
    if (filteredParts.length > 2) {
        return filteredParts[0]
    }

    return null
}
