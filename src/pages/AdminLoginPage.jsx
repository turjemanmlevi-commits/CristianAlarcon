import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminLoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (email !== 'leviturjeman@gmail.com') {
            setError('Acceso restringido. Solo el administrador puede entrar aquí.')
            setLoading(false)
            return
        }

        const { error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (loginError) {
            setError('Credenciales incorrectas.')
        }
        setLoading(false)
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
                        {loading ? 'Verificando...' : 'Entrar al Panel'}
                    </button>
                </form>
            </div>
        </div>
    )
}
