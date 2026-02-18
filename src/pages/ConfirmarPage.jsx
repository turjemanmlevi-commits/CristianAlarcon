import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { format, parseISO, addMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import AppBar from '../components/AppBar'
import { syncToGoogleSheets } from '../utils/googleSheets'
import { useTenant } from '../context/TenantContext'

export default function ConfirmarPage({ user, onConfirm }) {
    const { tenant } = useTenant()
    const navigate = useNavigate()
    const location = useLocation()
    const { service, professional, date, time, bookingToChange } = location.state || {}

    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    if (!service || !date || !time) {
        navigate('/servicios')
        return null
    }

    if (!user) {
        navigate('/login', {
            state: { returnTo: '/confirmar', service, professional, selectedDate: date, selectedTime: time }
        })
        return null
    }

    const dateObj = parseISO(date)
    const [hours, minutes] = time.split(':').map(Number)
    const startDateTime = new Date(dateObj)
    startDateTime.setHours(hours, minutes, 0, 0)
    const endDateTime = addMinutes(startDateTime, service.duration_min)

    const formattedDate = format(dateObj, "EEEE d 'de' MMMM", { locale: es })
    const formattedPrice = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
    }).format(service.price)

    const handleConfirm = async () => {
        setLoading(true)
        setError('')

        let proId = professional?.id
        if (!proId) {
            const { data: pros } = await supabase
                .from('barber_professionals')
                .select('id')
                .eq('is_active', true)
                .or(`tenant_id.eq.${tenant.id},tenant_id.is.null`)
                .order('priority', { ascending: true })
                .limit(1)
            proId = pros?.[0]?.id
        }

        const { error: bookError } = await supabase
            .from('barber_bookings')
            .insert({
                user_id: user.id,
                service_id: service.id,
                professional_id: proId,
                start_datetime: startDateTime.toISOString(),
                end_datetime: endDateTime.toISOString(),
                status: 'confirmed',
                tenant_id: tenant.id
            })

        if (bookError) {
            setError('Error al crear la reserva: ' + bookError.message)
            setLoading(false)
            return
        }

        if (bookingToChange) {
            await supabase
                .from('barber_bookings')
                .delete()
                .eq('id', bookingToChange.id)
        }

        const syncData = {
            fecha_registro: format(new Date(), 'dd/MM/yyyy HH:mm'),
            fecha_cita: format(startDateTime, 'dd/MM/yyyy HH:mm'),
            nombre: user.user_metadata?.nombre || user.user_metadata?.full_name || user.email,
            email: user.email,
            telefono: user.user_metadata?.phone || user.user_metadata?.telefono || 'No proporcionado',
            estado: 'Confirmado',
            servicio: service.name,
            profesional: professional?.name || 'Asignación automática'
        }
        console.log('Enviando datos a Google:', syncData)
        await syncToGoogleSheets(syncData, tenant)

        if (onConfirm) onConfirm()
        setSuccess(true)
        setLoading(false)
    }

    const addToCalendar = (type) => {
        const title = `Cita ${tenant?.name || 'Barbería'}: ${service.name}`
        const details = `Cita con ${professional?.name || 'Barbero'} en ${tenant?.name || 'Barbería'}.`
        const loc = tenant?.address && tenant?.city ? `${tenant.address}, ${tenant.city}` : (tenant?.address || '')

        // Google and Apple need different date formats, specifically UTC for best compatibility
        const startStr = startDateTime.toISOString().replace(/-|:|\.\d+/g, "")
        const endStr = endDateTime.toISOString().replace(/-|:|\.\d+/g, "")

        if (type === 'google') {
            const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startStr}/${endStr}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(loc)}`
            window.open(url, '_blank')
        } else if (type === 'apple') {
            const uid = `${Date.now()}@${tenant?.slug || 'reservabarbero'}.reservabarbero.com`
            const now = new Date().toISOString().replace(/-|:|\.\d+/g, "")
            const icsData = [
                "BEGIN:VCALENDAR",
                "VERSION:2.0",
                `PRODID:-//${tenant?.name || 'ReservaBarbero'}//ES`,
                "CALSCALE:GREGORIAN",
                "METHOD:PUBLISH",
                "BEGIN:VEVENT",
                `UID:${uid}`,
                `DTSTAMP:${now}`,
                `DTSTART:${startStr}`,
                `DTEND:${endStr}`,
                `SUMMARY:${title}`,
                `DESCRIPTION:${details}`,
                `LOCATION:${loc}`,
                "STATUS:CONFIRMED",
                "END:VEVENT",
                "END:VCALENDAR"
            ].join("\r\n")
            const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' })
            const link = document.createElement('a')
            link.href = window.URL.createObjectURL(blob)
            link.setAttribute('download', 'cita_barberia.ics')
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    if (success) {
        return (
            <>
                <AppBar user={user} />
                <div className="success-screen">
                    <div className="success-screen__icon" style={{
                        fontSize: '64px',
                        color: 'var(--accent)',
                        background: 'rgba(212, 175, 55, 0.1)',
                        width: '100px',
                        height: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        margin: '0 auto 24px'
                    }}>✓</div>
                    <h2 className="success-screen__title">¡Cita confirmada!</h2>
                    <p className="success-screen__text">
                        Tu cita ha sido reservada con éxito para el {formattedDate} a las {time}h.
                    </p>

                    <div className="calendar-buttons">
                        <button className="btn btn--secondary btn--icon" onClick={() => addToCalendar('google')}>
                            <svg className="icon-calendar" viewBox="0 0 24 24" width="24" height="24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>Añadir a Google</span>
                        </button>
                        <button className="btn btn--secondary btn--icon" onClick={() => addToCalendar('apple')}>
                            <svg className="icon-calendar" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M17.066 12.182c.03 2.593 2.112 3.451 2.14 3.465a3.81 3.81 0 0 1-1.895 3.328c-.802 1.164-1.63 2.324-2.847 2.324-1.187 0-1.574-.72-2.936-.72-1.353 0-1.782.72-2.915.72-1.134 0-2.062-1.246-2.868-2.42-1.643-2.39-2.9-6.756-1.21-9.682C5.362 7.75 6.89 6.814 8.272 6.814c1.112 0 2.152.768 2.835.768.683 0 1.942-.924 3.265-.794.551.023 2.1.22 3.097 1.678a3.619 3.619 0 0 0-.915 3.716M13.67 4.542c-.59.715-1.42 1.187-2.235 1.187-.1 0-.21-.01-.318-.024a3.805 3.805 0 0 1 .914-2.618 3.504 3.504 0 0 1 2.304-1.127 3.056 3.056 0 0 1 .1 1.057c-.12.56-.464 1.15-.765 1.525z" />
                            </svg>
                            <span>Añadir a Apple</span>
                        </button>
                    </div>

                    <button className="btn btn--primary" onClick={() => navigate('/')} style={{ marginTop: '24px' }}>
                        Volver al inicio
                    </button>
                </div>
            </>
        )
    }

    return (
        <>
            <AppBar user={user} onBack={() => navigate('/calendario', { state: { service, professional } })} />
            <div className="page">
                <h1 className="page__title">Confirmar cita</h1>

                <div className="confirm-section" style={{ borderLeft: '3px solid var(--accent)', paddingLeft: '16px', background: 'rgba(212, 175, 55, 0.05)', borderRadius: '0 8px 8px 0', padding: '16px' }}>
                    <div className="confirm-label">Fecha y hora</div>
                    <div className="confirm-value" style={{ textTransform: 'capitalize' }}>{formattedDate}</div>
                    <div className="confirm-value" style={{ fontSize: '24px' }}>{time}h</div>
                </div>

                <div className="confirm-section" style={{ marginTop: '24px' }}>
                    <div className="confirm-label">Servicio</div>
                    <div className="confirm-value">{service.name}</div>
                    <div className="confirm-value--small">Duración: {service.duration_min} min</div>
                </div>

                <div className="confirm-section" style={{ marginTop: '16px' }}>
                    <div className="confirm-label">Profesional</div>
                    <div className="confirm-value">{professional?.name || 'Asignación automática'}</div>
                </div>

                <div className="confirm-section" style={{ marginTop: '16px' }}>
                    <div className="confirm-label">Precio</div>
                    <div className="confirm-value" style={{ color: 'var(--accent)', fontSize: '28px' }}>{formattedPrice}</div>
                </div>

                {error && <div className="form-error" style={{ marginBottom: '16px', color: 'var(--error)' }}>{error}</div>}

                <button
                    className="btn btn--primary"
                    onClick={handleConfirm}
                    disabled={loading}
                    style={{ marginTop: 'auto', padding: '20px' }}
                >
                    {loading ? 'Reservando...' : 'Confirmar cita'}
                </button>
            </div>
        </>
    )
}
