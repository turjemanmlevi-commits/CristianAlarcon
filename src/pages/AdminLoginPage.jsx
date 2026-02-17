import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminLoginPage({ user }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const admins = [
        'leviturjeman@gmail.com',
        'turjemanlevi@gmail.com',
        'turjemanmlevi@gmail.com'
    ]

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (!admins.includes(email)) {
            setError('Acceso restringido. Solo el administrador puede entrar aquí.')
            setLoading(false)
            return
        }

        const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (loginError) {
            setError('Credenciales incorrectas (Email o Contraseña).')
        }
        setLoading(false)
    }

    const handleGoogleLogin = async () => {
        setLoading(true)
        const { error: loginError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        })
        if (loginError) setError(loginError.message)
        setLoading(false)
    }

    const handleLogout = () => supabase.auth.signOut()

    // Si el usuario ya está logueado pero NO es admin
    if (user && !admins.includes(user.email)) {
        return (
            <div className="login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="login-card" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-card)', padding: '40px', borderRadius: '16px', border: '1px solid var(--error)' }}>
                    <h1 style={{ textAlign: 'center', color: 'var(--error)', marginBottom: '10px' }}>Acceso Denegado</h1>
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '30px' }}>
                        Has iniciado sesión con <strong>{user.email}</strong>, pero este correo no tiene permisos de administrador.
                    </p>
                    <button onClick={handleLogout} className="btn btn--secondary" style={{ width: '100%' }}>
                        Cerrar Sesión e Intentar con otro
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="login-card" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-card)', padding: '40px', borderRadius: '16px', border: '1px solid var(--accent-dark)' }}>
                <h1 style={{ textAlign: 'center', color: 'var(--accent)', marginBottom: '10px' }}>Plataforma Privada</h1>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '30px' }}>Acceso exclusivo para administradores</p>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Email Administrador</label>
                        <input
                            type="email"
                            placeholder="email@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ marginTop: '20px' }}>
                        <label>Contraseña</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <div className="error-message" style={{ marginTop: '20px', color: 'var(--error)', textAlign: 'center' }}>{error}</div>}

                    <button type="submit" className="btn btn--primary" style={{ width: '100%', marginTop: '30px' }} disabled={loading}>
                        {loading ? 'Verificando...' : 'Entrar con Contraseña'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: 'var(--text-secondary)' }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--bg-card-hover)' }}></div>
                        <span style={{ padding: '0 10px', fontSize: '12px' }}>O</span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--bg-card-hover)' }}></div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="btn btn--secondary"
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            backgroundColor: 'white',
                            color: '#333',
                            border: '1px solid #ddd'
                        }}
                        disabled={loading}
                    >
                        <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '18px', height: '18px' }} />
                        {loading ? 'Cargando...' : 'Continuar con Google'}
                    </button>
                </form>
            </div>
        </div>
    )
}
