import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AppBar from '../components/AppBar'
import { useTenant } from '../context/TenantContext'

export default function ServiciosPage({ user }) {
    const { tenant } = useTenant()
    const navigate = useNavigate()
    const location = useLocation()
    const [services, setServices] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!tenant) return

        supabase
            .from('barber_services')
            .select('*')
            .eq('is_active', true)
            .or(`tenant_id.eq.${tenant.id},tenant_id.is.null`)
            .order('price', { ascending: true })
            .then(({ data }) => {
                setServices(data || [])
                setLoading(false)
            })
    }, [tenant])

    const handleSelect = (service) => {
        if (tenant?.hide_professionals) {
            // Plantilla: saltar profesional, ir directo al calendario
            navigate('/calendario', { state: { service, professional: null, bookingToChange: location.state?.bookingToChange } })
        } else {
            navigate('/profesional', { state: { service, bookingToChange: location.state?.bookingToChange } })
        }
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(price)
    }

    const getServiceIcon = (name) => {
        const color = "var(--accent)"
        const n = name.toLowerCase()

        // "Corte y Barba" or "Corte + Barba" → beard + scissors
        if ((n.includes('corte') && n.includes('barba'))) {
            return (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Beard */}
                    <path d="M14 20c0 0-2 12 10 16c12-4 10-16 10-16" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <path d="M18 24c0 0 1 6 6 8" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
                    <path d="M30 24c0 0-1 6-6 8" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
                    {/* Scissors */}
                    <circle cx="8" cy="10" r="3" stroke={color} strokeWidth="1.5" fill="none" />
                    <circle cx="8" cy="20" r="3" stroke={color} strokeWidth="1.5" fill="none" />
                    <line x1="11" y1="10" x2="18" y2="15" stroke={color} strokeWidth="1.5" />
                    <line x1="11" y1="20" x2="18" y2="15" stroke={color} strokeWidth="1.5" />
                </svg>
            )
        }

        // "Arreglo de barba" → beard only
        if (n.includes('barba') || n.includes('afeitado')) {
            return (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Face outline */}
                    <path d="M15 12c0-5 4-8 9-8s9 3 9 8v6" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none" />
                    <path d="M15 18v0c0 0-3 12 9 18c12-6 9-18 9-18" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    {/* Beard texture */}
                    <path d="M20 24c0 0 1 8 4 10" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                    <path d="M28 24c0 0-1 8-4 10" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                    <path d="M24 22v6" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
                </svg>
            )
        }

        // Default: Scissors (for "Corte Tradicional" etc.)
        return (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <line x1="20" y1="4" x2="8.12" y2="15.88" />
                <line x1="14.47" y1="14.48" x2="20" y2="20" />
                <line x1="8.12" y1="8.12" x2="12" y2="12" />
            </svg>
        )
    }

    return (
        <>
            <AppBar user={user} onBack={() => navigate('/')} />
            <div className="page">
                <h1 className="page__title">Servicios</h1>

                {loading ? (
                    <div className="loading"><div className="spinner" /></div>
                ) : services.length === 0 ? (
                    <div className="info-banner" style={{ textAlign: 'center', padding: '40px 20px' }}>
                        No hay servicios disponibles en este momento.
                    </div>
                ) : (
                    services.map(service => (
                        <div
                            key={service.id}
                            className="card service-card"
                            onClick={() => handleSelect(service)}
                            style={{ justifyContent: 'space-between' }}
                        >
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span className="service-card__name">{service.name}</span>
                                <span className="service-card__price">{formatPrice(service.price)}</span>
                            </div>
                            <div style={{ marginLeft: '16px' }}>
                                {getServiceIcon(service.name)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    )
}
