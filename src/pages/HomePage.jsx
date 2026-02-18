import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import AppBar from '../components/AppBar'
import { useTenant } from '../context/TenantContext'

export default function HomePage({ user, nextBooking, loadingBooking }) {
    const { tenant } = useTenant()
    const navigate = useNavigate()

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/'
            }
        })
        if (error) console.error('Error logging in with Google:', error.message)
    }

    // VISTA PARA CADA BARBERÍA (incluyendo reservabarbero.com como plantilla)
    return (
        <>
            <AppBar user={user} />
            <div className="hero">
                <div className="hero__logo-container">
                    {tenant.logo_url ? (
                        <img src={tenant.logo_url} alt={tenant.name} className="hero__logo-img" />
                    ) : (
                        <img src="/logo.png" alt="Logo" className="hero__logo-img" />
                    )}
                </div>

                <div className="hero__cta">
                    {loadingBooking ? (
                        <div className="loading" style={{ minHeight: '100px' }}><div className="spinner" /></div>
                    ) : !user ? (
                        <>
                            {tenant?.whatsapp && (
                                <a
                                    href={`https://wa.me/${tenant.whatsapp.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        color: 'var(--text-secondary)',
                                        fontSize: '16px',
                                        fontWeight: '500',
                                        textDecoration: 'none',
                                        marginBottom: '12px'
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                                    </svg>
                                    {tenant.whatsapp_display || tenant.whatsapp}
                                </a>
                            )}
                            <button className="btn btn--primary" onClick={() => navigate('/servicios')}>
                                Pedir cita
                            </button>
                            <button className="btn btn--google" onClick={handleGoogleLogin} style={{ marginTop: '12px' }}>
                                <svg viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Añadir mi cuenta de Google
                            </button>
                        </>
                    ) : nextBooking ? (
                        <div className="next-appointment-card">
                            <div className="next-appointment-card__header">Tu próxima cita</div>
                            <div className="next-appointment-card__service">{nextBooking.barber_services?.name}</div>
                            <div className="next-appointment-card__date">
                                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '6px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>{format(parseISO(nextBooking.start_datetime), "EEEE d 'de' MMMM", { locale: es })}</span>
                                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '6px' }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>{format(parseISO(nextBooking.start_datetime), 'HH:mm')}h</span>
                            </div>
                            <div className="next-appointment-card__pro"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '6px' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>{nextBooking.barber_professionals?.name}</div>

                            <div className="next-appointment-card__actions">
                                <button className="btn btn--secondary btn--sm" onClick={() => navigate('/perfil')}>Gestionar</button>
                                <button className="btn btn--primary btn--sm" onClick={() => navigate('/servicios')}>Nueva Cita</button>
                            </div>
                        </div>
                    ) : (
                        <button className="btn btn--primary" onClick={() => navigate('/servicios')}>
                            Pedir cita
                        </button>
                    )}
                </div>

                <div className="hero__info">
                    {tenant.google_maps_url && (
                        <a href={tenant.google_maps_url} target="_blank" rel="noopener noreferrer" className="location-card">
                            <div className="location-card__icon">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                            </div>
                            <div className="location-card__text">
                                <div className="location-card__address">{tenant.address}</div>
                                <div className="location-card__city">{tenant.city}</div>
                            </div>
                            <div className="location-card__arrow">›</div>
                        </a>
                    )}

                    <div className="location-card location-card--static">
                        <div className="location-card__icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <div className="location-card__text">
                            <div className="location-card__address">{tenant.schedule_days || 'Lunes - Sábado'}</div>
                            <div className="location-card__city">{tenant.schedule_hours || '10:00 - 20:00'}</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
