import { Routes, Route } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import HomePage from './pages/HomePage'
import ServiciosPage from './pages/ServiciosPage'
import ProfesionalPage from './pages/ProfesionalPage'
import CalendarioPage from './pages/CalendarioPage'
import LoginPage from './pages/LoginPage'
import RegistroPage from './pages/RegistroPage'
import ConfirmarPage from './pages/ConfirmarPage'
import PerfilPage from './pages/PerfilPage'
import AdminLoginPage from './pages/AdminLoginPage'
import { useTenant } from './context/TenantContext'

export default function App() {
    const { tenant, loading: loadingTenant } = useTenant()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [nextBooking, setNextBooking] = useState(null)
    const [loadingBooking, setLoadingBooking] = useState(false)

    const fetchNextBooking = useCallback(async (userId) => {
        if (!userId) {
            setNextBooking(null)
            return
        }
        setLoadingBooking(true)

        let query = supabase
            .from('barber_bookings')
            .select(`
                *,
                barber_services(name, price),
                barber_professionals(name)
            `)
            .eq('user_id', userId)
            .eq('status', 'confirmed')
            .gte('start_datetime', new Date().toISOString())
            .order('start_datetime', { ascending: true })

        if (tenant) {
            query = query.eq('tenant_id', tenant.id)
        }

        const { data } = await query

        // Filtro de seguridad con la lista negra local por USUARIO
        const blacklistKey = `cancelled_bookings_${userId}`
        const localCancelled = JSON.parse(localStorage.getItem(blacklistKey) || '[]').map(String)
        const validBookings = (data || []).filter(b => !localCancelled.includes(String(b.id)))

        setNextBooking(validBookings[0] || null)
        setLoadingBooking(false)
    }, [])

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null
            setUser(currentUser)
            if (currentUser) fetchNextBooking(currentUser.id)
            setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null
            setUser(currentUser)
            if (currentUser) {
                fetchNextBooking(currentUser.id)
            } else {
                setNextBooking(null)
            }
        })
        return () => subscription.unsubscribe()
    }, [fetchNextBooking])

    const refreshBookings = async () => {
        if (!user) return
        // Pequeño retardo para asegurar que la base de datos ha procesado el cambio
        await new Promise(r => setTimeout(r, 500))
        fetchNextBooking(user.id)
    }

    if (loading || loadingTenant) {
        return <div className="app-container"><div className="loading"><div className="spinner" /></div></div>
    }

    if (!tenant) {
        const hostname = window.location.hostname
        const parts = hostname.split('.').filter(p => p !== 'www')

        // Si estamos en un subdominio real (más de 2 partes) y no se encontró el tenant
        if (parts.length > 2 && !hostname.endsWith('localhost')) {
            return (
                <div className="app-container">
                    <div style={{ textAlign: 'center', padding: '50px', color: 'white' }}>
                        <h1>404 - Barbería no encontrada</h1>
                        <p>La barbería solicitada no existe o el enlace es incorrecto.</p>
                    </div>
                </div>
            )
        }
    }

    return (
        <div className="app-container">
            <Routes>
                <Route path="/" element={
                    tenant ? (
                        <HomePage
                            user={user}
                            nextBooking={nextBooking}
                            loadingBooking={loadingBooking}
                            refresh={refreshBookings}
                        />
                    ) : (
                        <AdminLoginPage user={user} />
                    )
                } />
                <Route path="/admin-login" element={<AdminLoginPage user={user} />} />
                <Route path="/servicios" element={<ServiciosPage user={user} />} />
                <Route path="/profesional" element={<ProfesionalPage user={user} />} />
                <Route path="/calendario" element={<CalendarioPage user={user} />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registro" element={<RegistroPage />} />
                <Route path="/confirmar" element={<ConfirmarPage user={user} onConfirm={refreshBookings} />} />
                <Route path="/perfil" element={<PerfilPage user={user} onCancel={refreshBookings} />} />
            </Routes>
        </div>
    )
}
