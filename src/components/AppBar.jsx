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
