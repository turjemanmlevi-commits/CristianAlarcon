import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AppBar from '../components/AppBar'
import { useTenant } from '../context/TenantContext'

export default function ServiciosPage({ user }) {
    const { tenant } = useTenant()
    const navigate = useNavigate()
    const [services, setServices] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!tenant) return

        supabase
            .from('barber_services')
            .select('*')
            .eq('is_active', true)
            .eq('tenant_id', tenant.id)
            .order('price', { ascending: true })
            .then(({ data }) => {
                setServices(data || [])
                setLoading(false)
            })
    }, [tenant])

    const handleSelect = (service) => {
        navigate('/profesional', { state: { service } })
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
        }).format(price)
    }

    const getServiceIcon = (name) => {
        const color = "var(--accent)"
        const strokeWidth = 1.2

        // Check for beard/shave
        if (name.toLowerCase().includes('barba') || name.toLowerCase().includes('afeitado')) {
            // Elegant Straight Razor
            return (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5c0 .8.7 1.5 1.5 1.5h13c.8 0 1.5-.7 1.5-1.5v-2c0-.8-.7-1.5-1.5-1.5h-13c-.8 0-1.5.7-1.5 1.5v2z" /> {/* Handle */}
                    <path d="M18 16l-2-11c-.5-1.5-3-1.5-3.5 0l-2 5" /> {/* Blade arm */}
                    <path d="M8 14c2-3 6-3 8 0" /> {/* Blade curve */}
                </svg>
            )
        }
        // Vintage/Elegant Scissors
        return (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <line x1="20" y1="4" x2="8.12" y2="15.88" />
                <line x1="14.47" y1="14.48" x2="20" y2="20" />
                <line x1="8.12" y1="8.12" x2="12" y2="12" />
                <path d="M19 5l1 1" />
            </svg>
        )
    }

    return (
        <>
            <AppBar user={user} onBack={() => navigate('/')} />
            <div className="page">
                <h1 className="page__title">Servicio</h1>

                {loading ? (
                    <div className="loading"><div className="spinner" /></div>
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
