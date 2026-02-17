import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AppBar from '../components/AppBar'

export default function RegistroPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const returnState = location.state || {}

    const [nombre, setNombre] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleRegister = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { nombre, phone }
            }
        })

        if (signUpError) {
            setError(signUpError.message)
            setLoading(false)
            return
        }

        // After sign up, try to sign in immediately
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email, password
        })

        if (signInError) {
            // Might need email confirmation
            setError('Cuenta creada. Revisa tu email para confirmarla e inicia sesión.')
            setLoading(false)
            return
        }

        if (returnState.returnTo) {
            navigate(returnState.returnTo, {
                state: {
                    service: returnState.service,
                    professional: returnState.professional,
                    date: returnState.selectedDate,
                    time: returnState.selectedTime
                }
            })
        } else {
            navigate('/')
        }
    }

    const handleGoogleLogin = async () => {
        // Save state before redirecting
        if (returnState.returnTo) {
            localStorage.setItem('google_auth_return_state', JSON.stringify(returnState))
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.href
            }
        })
        if (error) setError(error.message)
    }

    return (
        <>
            <AppBar onBack={() => navigate('/login', { state: returnState })} />
            <div className="page">
                <h1 className="page__title">Crear cuenta</h1>

                <div className="form-card">
                    <form onSubmit={handleRegister}>
                        <div className="form-group">
                            <label htmlFor="nombre">Nombre</label>
                            <input
                                id="nombre"
                                className="form-input"
                                type="text"
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                placeholder="Tu nombre"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-email">Email</label>
                            <input
                                id="reg-email"
                                className="form-input"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="tu@email.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">Teléfono (opcional)</label>
                            <input
                                id="phone"
                                className="form-input"
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="+34 600 000 000"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="reg-password">Contraseña</label>
                            <input
                                id="reg-password"
                                className="form-input"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                required
                                minLength={6}
                            />
                        </div>

                        {error && <div className="form-error">{error}</div>}

                        <button
                            type="submit"
                            className="btn btn--primary"
                            disabled={loading}
                            style={{ marginTop: '16px' }}
                        >
                            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                        </button>
                    </form>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: 'var(--text-secondary)' }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
                        <span style={{ padding: '0 10px', fontSize: '12px' }}>O</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
                    </div>

                    <button className="btn btn--google" onClick={handleGoogleLogin} style={{ marginTop: 0 }}>
                        <svg viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continuar con Google
                    </button>
                </div>

                <div className="form-footer">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" state={returnState}>Acceder</Link>
                </div>
            </div>
        </>
    )
}
