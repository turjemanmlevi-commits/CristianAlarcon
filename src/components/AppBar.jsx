import { useNavigate } from 'react-router-dom'

export default function AppBar({ user, onBack }) {
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
            <div className="appbar__logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                C. Alarcón
            </div>
            <div>
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
