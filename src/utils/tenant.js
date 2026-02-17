export const getSubdomain = () => {
    const hostname = window.location.hostname
    const parts = hostname.split('.')

    // Si estamos en localhost y hay más de 1 parte (ej: cristianalarconbarbero.localhost)
    if (hostname.endsWith('localhost')) {
        return parts.length > 1 ? parts[0] : null
    }

    // Si hay más de 2 partes (ej: cristianalarconbarbero.reservabarbero.com)
    if (parts.length > 2) {
        return parts[0]
    }

    return null
}
