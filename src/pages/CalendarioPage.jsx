import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { format, addDays, startOfWeek, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { getAvailability } from '../utils/availability'
import AppBar from '../components/AppBar'
import { useTenant } from '../context/TenantContext'

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

export default function CalendarioPage({ user }) {
    const { tenant } = useTenant()
    const navigate = useNavigate()
    const location = useLocation()
    const service = location.state?.service
    const professional = location.state?.professional

    const [weekStart, setWeekStart] = useState(() =>
        startOfWeek(new Date(), { weekStartsOn: 1 })
    )
    const [availability, setAvailability] = useState({})
    const [loading, setLoading] = useState(true)

    const fetchSlots = useCallback(async () => {
        if (!service || !tenant) return
        setLoading(true)
        const dateStr = format(weekStart, 'yyyy-MM-dd')
        const slots = await getAvailability(
            dateStr,
            professional?.id || null,
            service.duration_min,
            tenant.id,
            tenant.open_hour ?? 10,
            tenant.open_min ?? 0,
            tenant.close_hour ?? 20,
            tenant.close_min ?? 0
        )
        setAvailability(slots)
        setLoading(false)
    }, [weekStart, service, professional, tenant])

    useEffect(() => {
        if (!service) {
            navigate('/servicios')
            return
        }
        fetchSlots()
    }, [service, fetchSlots, navigate])

    const handlePrevWeek = () => {
        setWeekStart(prev => addDays(prev, -7))
    }

    const handleNextWeek = () => {
        setWeekStart(prev => addDays(prev, 7))
    }

    const handleSlotClick = (dateStr, time) => {
        if (!user) {
            // Redirect to login, preserve state for return
            navigate('/login', {
                state: { returnTo: '/calendario', service, professional, selectedDate: dateStr, selectedTime: time }
            })
            return
        }

        navigate('/confirmar', {
            state: { service, professional, date: dateStr, time, bookingToChange: location.state?.bookingToChange }
        })
    }

    const weekEndDate = addDays(weekStart, 6)
    const weekLabel = `${format(weekStart, 'd', { locale: es })} - ${format(weekEndDate, 'd MMM', { locale: es })}.`

    if (!service) return null

    return (
        <>
            <AppBar user={user} onBack={() => navigate('/profesional', { state: { service } })} />
            <div className="page">
                <div className="dropdown-row">
                    <select className="dropdown" value={service.name} disabled>
                        <option>{service.name}</option>
                    </select>
                    <select className="dropdown" value={professional?.name || 'Indiferente'} disabled>
                        <option>{professional?.name || 'Indiferente'}</option>
                    </select>
                </div>

                <div className="calendar-nav">
                    <button className="calendar-nav__btn" onClick={handlePrevWeek}>←</button>
                    <span className="calendar-nav__label">{weekLabel}</span>
                    <button className="calendar-nav__btn" onClick={handleNextWeek}>→</button>
                </div>

                {loading ? (
                    <div className="loading"><div className="spinner" /></div>
                ) : (
                    Array.from({ length: 7 }).map((_, i) => {
                        const date = addDays(weekStart, i)
                        const dateStr = format(date, 'yyyy-MM-dd')
                        const slots = availability[dateStr] || []
                        const dayName = DAY_NAMES[date.getDay()]
                        const dayNum = format(date, 'd')
                        const today = isToday(date)

                        return (
                            <div key={dateStr} className="day-section">
                                <div className="day-section__header">
                                    {dayName} {dayNum}
                                    {today && <span className="day-section__today">HOY</span>}
                                </div>
                                {slots.length === 0 ? (
                                    <div className="day-section__empty">No hay citas disponibles</div>
                                ) : (
                                    <div className="slots-grid">
                                        {slots.map(time => (
                                            <button
                                                key={time}
                                                className="slot-chip"
                                                onClick={() => handleSlotClick(dateStr, time)}
                                            >
                                                {time}
                                            </button>
                                        ))}
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
