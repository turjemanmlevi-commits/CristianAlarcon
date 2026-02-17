import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import AppBar from '../components/AppBar'
import { useTenant } from '../context/TenantContext'

const DEFAULT_GOOGLE_MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=C.+Buganvillas+39+Local+7+29651+Las+Lagunas+de+Mijas+Malaga'

export default function HomePage({ user, nextBooking, loadingBooking }) {
    const { tenant } = useTenant()
    const navigate = useNavigate()

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/login'
            }
        })
        if (error) console.error('Error logging in with Google:', error.message)
    }

    return (
        <>
            <AppBar user={user} />
            <div className="hero">
                <div className="hero__logo-text">{tenant?.name || 'Reserva Barbero'}</div>
                <div className="hero__subtitle">B A R B E R Í A</div>

                <div className="hero__logo-container">
                    {tenant?.logo_url ? (
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
                                <span>📅 {format(parseISO(nextBooking.start_datetime), "EEEE d 'de' MMMM", { locale: es })}</span>
                                <span>⏰ {format(parseISO(nextBooking.start_datetime), 'HH:mm')}h</span>
                            </div>
                            <div className="next-appointment-card__pro">👤 {nextBooking.barber_professionals?.name}</div>

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
                    <a href={tenant?.google_maps_url || DEFAULT_GOOGLE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="location-card">
                        <div className="location-card__icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                        </div>
                        <div className="location-card__text">
                            <div className="location-card__address">{tenant?.address || 'C. Buganvillas, 39, Local 7'}</div>
                            <div className="location-card__city">{tenant?.city || '29651 Las Lagunas de Mijas, Málaga'}</div>
                        </div>
                        <div className="location-card__arrow">›</div>
                    </a>

                    <div className="location-card location-card--static">
                        <div className="location-card__icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <div className="location-card__text">
                            <div className="location-card__address">Lunes - Sábado</div>
                            <div className="location-card__city">10:00 - 19:30</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
