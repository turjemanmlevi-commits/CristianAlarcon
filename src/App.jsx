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

export default function App() {
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

        const { data } = await supabase
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

    if (loading) {
        return <div className="app-container"><div className="loading"><div className="spinner" /></div></div>
    }

    return (
        <div className="app-container">
            <Routes>
                <Route path="/" element={
                    <HomePage
                        user={user}
                        nextBooking={nextBooking}
                        loadingBooking={loadingBooking}
                        refresh={refreshBookings}
                    />
                } />
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
