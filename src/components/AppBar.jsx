import { useNavigate } from 'react-router-dom'
import { useTenant } from '../context/TenantContext'

export default function AppBar({ user, onBack }) {
    const { tenant } = useTenant()
    const navigate = useNavigate()

    const handleAccountClick = () => {
        if (user) {
            navigate('/perfil')
        } else {
            navigate('/login')
        }
    }

    const getUserPhoto = () => {
        if (!user) return null
        const name = (user.user_metadata?.nombre || user.user_metadata?.full_name || user.email || "").toLowerCase()

        if (name.includes('daniel')) return '/daniel.png'
        if (name.includes('cristian')) return '/cristian.png'
        if (name.includes('nasir')) return '/nasir.png'

        return null
    }

    const userPhoto = getUserPhoto()

    return (
        <header className="appbar">
            <div>
                {onBack && (
                    <button className="appbar__back" onClick={onBack} aria-label="Volver">
                        ←
                    </button>
                )}
            </div>
            <div className="appbar__logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {tenant?.logo_url ? (
                    <img src={tenant.logo_url} alt={tenant.name} style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
                ) : (
                    <img src="/logo.png" alt="Logo" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
                )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <a
                    href="https://wa.me/34608335373"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                </a>
                <a
                    href="https://www.instagram.com/barberiacristianalarcon/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <circle cx="12" cy="12" r="5" />
                        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
                    </svg>
                </a>
                <button className="appbar__action" onClick={handleAccountClick} aria-label="Cuenta" style={{ position: 'relative', padding: 0, border: 'none', background: 'none' }}>
                    {userPhoto ? (
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '1px solid var(--accent)'
                        }}>
                            <img src={userPhoto} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    )}
                    {user && <span style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        fontSize: '10px',
                        color: 'var(--accent)'
                    }}>●</span>}
                </button>
            </div>
        </header>
    )
}
