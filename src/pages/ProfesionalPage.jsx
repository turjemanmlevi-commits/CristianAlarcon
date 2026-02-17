import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AppBar from '../components/AppBar'
import { useTenant } from '../context/TenantContext'

export default function ProfesionalPage({ user }) {
    const { tenant } = useTenant()
    const navigate = useNavigate()
    const location = useLocation()
    const service = location.state?.service

    const [professionals, setProfessionals] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!service) {
            navigate('/servicios')
            return
        }
        if (!tenant) return

        supabase
            .from('barber_professionals')
            .select('*')
            .eq('is_active', true)
            .eq('tenant_id', tenant.id)
            .order('priority', { ascending: true })
            .then(({ data }) => {
                setProfessionals(data || [])
                setLoading(false)
            })
    }, [service, navigate, tenant])

    const handleSelect = (professional) => {
        navigate('/calendario', {
            state: { service, professional }
        })
    }

    const handleIndifferent = () => {
        navigate('/calendario', {
            state: { service, professional: null }
        })
    }

    const getProfessionalIcon = (name) => {
        const color = "var(--accent)"

        const photoStyle = {
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: `2px solid ${color}`,
            marginRight: '20px'
        }

        const imgStyle = { width: '100%', height: '100%', objectFit: 'cover' }

        const nameLower = name.toLowerCase()
        let photoSrc = null
        if (nameLower.includes('cristian')) photoSrc = "/cristian.png"
        else if (nameLower.includes('daniel')) photoSrc = "/daniel.png"
        else if (nameLower.includes('nasir')) photoSrc = "/nasir.png"

        if (photoSrc) {
            return (
                <div style={photoStyle}>
                    <img src={photoSrc} alt={name} style={imgStyle} />
                </div>
            )
        }

        return (
            <div style={photoStyle}>
                <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            </div>
        )
    }

    if (!service) return null

    return (
        <>
            <AppBar user={user} onBack={() => navigate('/servicios')} />
            <div className="page">
                <h1 className="page__title">Profesional</h1>

                {loading ? (
                    <div className="loading"><div className="spinner" /></div>
                ) : (
                    <>
                        {/* Indifirente con barra de burbujas horizontal */}
                        <div
                            className="card pro-card pro-card--indifferent"
                            onClick={handleIndifferent}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '20px',
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '24px',
                                minHeight: '100px'
                            }}
                        >
                            <div style={{ display: 'flex', marginRight: '20px' }}>
                                <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent)', marginRight: '-15px', zIndex: 3, background: '#000' }}>
                                    <img src="/cristian.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent)', marginRight: '-15px', zIndex: 2, background: '#000' }}>
                                    <img src="/daniel.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent)', zIndex: 1, background: '#000' }}>
                                    <img src="/nasir.png" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            </div>
                            <div className="pro-card__name" style={{ position: 'static', padding: 0, fontWeight: '700', fontSize: '18px' }}>Cualquier profesional</div>
                        </div>

                        {/* Listado de peluqueros 1 a 1 (uno por línea) */}
                        <div className="pro-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {professionals.map(pro => (
                                <div
                                    key={pro.id}
                                    className="card pro-card"
                                    onClick={() => handleSelect(pro)}
                                    style={{
                                        backgroundColor: '#1C1C1C',
                                        backgroundImage: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        height: 'auto',
                                        padding: '16px',
                                        border: pro.name.toLowerCase().includes('cristian') ? '1px solid var(--accent)' : '1px solid var(--border-subtle)'
                                    }}
                                >
                                    {getProfessionalIcon(pro.name)}
                                    <div className="pro-card__name" style={{ position: 'static', padding: 0, textAlign: 'left', fontSize: '18px', fontWeight: '600' }}>{pro.name}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    )
}
