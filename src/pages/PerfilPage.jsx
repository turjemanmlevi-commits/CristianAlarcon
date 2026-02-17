import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AppBar from '../components/AppBar'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { syncToGoogleSheets } from '../utils/googleSheets'
import { useTenant } from '../context/TenantContext'

export default function PerfilPage({ user, onCancel }) {
    const { tenant } = useTenant()
    const navigate = useNavigate()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchBookings = useCallback(async () => {
        if (!user) return

        let query = supabase
            .from('barber_bookings')
            .select(`
              *,
              barber_services(name, price),
              barber_professionals(name)
            `)
            .eq('user_id', user.id)
            .eq('status', 'confirmed') // Traer solo las confirmadas activas
            .gte('start_datetime', new Date().toISOString())
            .order('start_datetime', { ascending: true })

        if (tenant) {
            query = query.or(`tenant_id.eq.${tenant.id},tenant_id.is.null`)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching:', error)
        }

        setBookings(data || [])
        setLoading(false)
    }, [user])

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }
        fetchBookings()
    }, [user, navigate, fetchBookings])

    const handleCancel = async (bookingId) => {
        const bId = String(bookingId)
        if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return

        // 2. OPERACIÓN EN BASE DE DATOS: Borrado físico
        try {
            const booking = bookings.find(b => String(b.id) === bId)

            if (booking) {
                // Sincronizar con Google Sheets ANTES de borrar
                await syncToGoogleSheets({
                    fecha_registro: format(new Date(), 'dd/MM/yyyy HH:mm'),
                    fecha_cita: format(parseISO(booking.start_datetime), 'dd/MM/yyyy HH:mm'),
                    nombre: user.user_metadata?.nombre || user.user_metadata?.full_name || user.email,
                    email: user.email,
                    telefono: user.user_metadata?.phone || user.user_metadata?.telefono || 'No proporcionado',
                    estado: 'CANCELADO',
                    servicio: booking.barber_services?.name,
                    profesional: booking.barber_professionals?.name
                }).catch(() => { })

                // BORRADO FÍSICO DE LA BASE DE DATOS
                const { error: deleteError } = await supabase
                    .from('barber_bookings')
                    .delete()
                    .eq('id', bookingId)
                    .eq('user_id', user.id)

                if (deleteError) throw deleteError

                // CAPA DE SEGURIDAD EXTRA: Lista negra local inmediata
                const blacklistKey = `cancelled_bookings_${user.id}`
                const localCancelled = JSON.parse(localStorage.getItem(blacklistKey) || '[]').map(String)
                if (!localCancelled.includes(bId)) {
                    localCancelled.push(bId)
                    localStorage.setItem(blacklistKey, JSON.stringify(localCancelled))
                }

                // Actualizar estado local para que desaparezca YA
                setBookings(prev => prev.filter(b => String(b.id) !== bId))
            }

            // Avisamos a la Home Page de que refresque con un retardo mayor
            setTimeout(() => {
                if (onCancel) onCancel()
            }, 1000)

            alert('Cita cancelada y borrada de la base de datos.')
        } catch (e) {
            console.error('Error al borrar la cita:', e)
            alert('Hubo un error al intentar cancelar la cita.')
        }
    }


    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/')
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

    if (!user) return null

    return (
        <>
            <AppBar user={user} onBack={() => navigate('/')} />
            <div className="page">
                <h1 className="page__title">Mi Cuenta</h1>

                <div className="form-card" style={{ marginBottom: '24px' }}>
                    {userPhoto && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '2px solid var(--accent)'
                            }}>
                                <img src={userPhoto} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        </div>
                    )}
                    <div className="form-group">
                        <label>Email</label>
                        <div className="confirm-value" style={{ fontSize: '15px', padding: '8px 0' }}>{user.email}</div>
                    </div>
                    {(user.user_metadata?.full_name || user.user_metadata?.nombre) && (
                        <div className="form-group" style={{ marginTop: '8px' }}>
                            <label>Nombre</label>
                            <div className="confirm-value" style={{ fontSize: '15px', padding: '8px 0' }}>{user.user_metadata.full_name || user.user_metadata.nombre}</div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                        <button
                            className="btn btn--secondary"
                            style={{ borderColor: '#ff4444', color: '#ff4444' }}
                            onClick={async () => {
                                if (!window.confirm('⚠️ ¿BORRAR ABSOLUTAMENTE TODAS TUS CITAS? Esta acción no se puede deshacer.')) return
                                setLoading(true)
                                let deleteQuery = supabase.from('barber_bookings').delete().eq('user_id', user.id)
                                if (tenant) {
                                    deleteQuery = deleteQuery.or(`tenant_id.eq.${tenant.id},tenant_id.is.null`)
                                }
                                const { error } = await deleteQuery
                                if (!error) {
                                    setBookings([])
                                    // Limpiar también la lista negra local por si acaso
                                    localStorage.removeItem(`cancelled_bookings_${user.id}`)
                                    alert('Se han borrado todas tus citas de la base de datos.')
                                } else {
                                    alert('Error al borrar: ' + error.message)
                                }
                                setLoading(false)
                            }}
                        >
                            Borrar todo mi historial de citas
                        </button>
                        <button className="btn btn--secondary" onClick={handleLogout}>
                            Cerrar Sesión
                        </button>
                    </div>
                </div>

                <h2 className="page__subtitle">Próximas Reservas</h2>
                {loading ? (
                    <div className="loading"><div className="spinner" /></div>
                ) : bookings.length === 0 ? (
                    <div className="info-banner" style={{ background: 'transparent', border: '1px dashed var(--border-subtle)', textAlign: 'center', padding: '40px 20px' }}>
                        No tienes citas activas.
                    </div>
                ) : (
                    bookings.map(book => {
                        const isCancelled = book.status === 'cancelled'
                        const cardColor = isCancelled ? '#ff4444' : 'var(--accent)'

                        return (
                            <div key={book.id} className="card" style={{
                                marginBottom: '16px',
                                borderLeft: `3px solid ${cardColor}`,
                                opacity: isCancelled ? 0.8 : 1
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 700, color: cardColor, fontSize: '16px' }}>
                                        {book.barber_services?.name}
                                    </span>
                                    <span style={{
                                        fontSize: '11px',
                                        color: isCancelled ? '#ff4444' : 'var(--text-secondary)',
                                        background: isCancelled ? 'rgba(255, 68, 68, 0.1)' : 'rgba(0,196,140,0.1)',
                                        padding: '2px 8px',
                                        borderRadius: '10px'
                                    }}>
                                        {isCancelled ? '✘ Cancelada' : '✓ Activa'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '14px', marginBottom: '4px', color: '#fff' }}>
                                    📅 {format(parseISO(book.start_datetime), "d 'de' MMMM", { locale: es })} a las {format(parseISO(book.start_datetime), 'HH:mm')}h
                                </div>
                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                    👤 Barbero: {book.barber_professionals?.name}
                                </div>

                                {!isCancelled && (
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                                        <button
                                            className="btn btn--secondary btn--sm"
                                            style={{ borderColor: 'rgba(255, 68, 68, 0.4)', color: '#ff4444', flex: 1 }}
                                            onClick={() => handleCancel(book.id)}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            className="btn btn--secondary btn--sm"
                                            style={{ flex: 1 }}
                                            onClick={() => navigate('/servicios', { state: { bookingToChange: book } })}
                                        >
                                            Cambiar
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </>
    )
}
