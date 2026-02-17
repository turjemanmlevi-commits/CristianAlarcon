import { supabase } from '../lib/supabase'
import { format, addMinutes, isBefore, isAfter, startOfDay, parseISO } from 'date-fns'

/**
 * Generate available time slots for a given week.
 * @param {string} weekStart - ISO date string for Monday of the week (YYYY-MM-DD)
 * @param {string|null} professionalId - UUID or null for "Indiferente"
 * @param {number} serviceDurationMin - duration of the service in minutes
 * @returns {Object} { 'YYYY-MM-DD': ['HH:mm', ...], ... }
 */
export async function getAvailability(weekStart, professionalId, serviceDurationMin, tenantId) {
    // Fetch professionals
    let proQuery = supabase.from('barber_professionals').select('*').eq('is_active', true)
    if (tenantId) {
        proQuery = proQuery.eq('tenant_id', tenantId)
    }
    if (professionalId) {
        proQuery = proQuery.eq('id', professionalId)
    }
    const { data: professionals } = await proQuery

    if (!professionals || professionals.length === 0) return {}

    const proIds = professionals.map(p => p.id)

    // Calculate week end (Sunday)
    const weekStartDate = parseISO(weekStart)
    const weekEndDate = addMinutes(startOfDay(new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000)), -1)

    // Fetch blocks overlapping this week
    let blocksQuery = supabase
        .from('barber_blocks')
        .select('*')
        .in('professional_id', proIds)
        .lte('start_datetime', weekEndDate.toISOString())
        .gte('end_datetime', weekStartDate.toISOString())

    if (tenantId) {
        blocksQuery = blocksQuery.eq('tenant_id', tenantId)
    }
    const { data: blocks } = await blocksQuery

    // Fetch bookings overlapping this week
    let bookingsQuery = supabase
        .from('barber_bookings')
        .select('*')
        .in('professional_id', proIds)
        .in('status', ['pending', 'confirmed'])
        .lte('start_datetime', weekEndDate.toISOString())
        .gte('end_datetime', weekStartDate.toISOString())

    if (tenantId) {
        bookingsQuery = bookingsQuery.eq('tenant_id', tenantId)
    }
    const { data: bookings } = await bookingsQuery

    const result = {}
    const now = new Date()

    // Working hours: 10:00 to 20:01
    const OPEN_H = 10
    const OPEN_M = 0
    const CLOSE_H = 20
    const CLOSE_M = 1

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDate = new Date(weekStartDate.getTime() + dayOffset * 24 * 60 * 60 * 1000)
        const dateStr = format(currentDate, 'yyyy-MM-dd')

        // Skip Sundays (assuming closed, as standard practice unless specified otherwise)
        if (currentDate.getDay() === 0) {
            result[dateStr] = []
            continue
        }

        const allSlots = new Set()

        for (const pro of professionals) {
            let slotStart = new Date(currentDate)
            slotStart.setHours(OPEN_H, OPEN_M, 0, 0)

            const dayEnd = new Date(currentDate)
            dayEnd.setHours(CLOSE_H, CLOSE_M, 0, 0)

            // Step fixed at 30 minutes for slot generation
            const stepMin = 30

            while (slotStart < dayEnd) {
                const slotEnd = addMinutes(slotStart, serviceDurationMin)

                // Slot must end before day end
                if (isAfter(slotEnd, dayEnd)) break

                // Skip if in the past
                if (isBefore(slotStart, now)) {
                    slotStart = addMinutes(slotStart, stepMin)
                    continue
                }

                // Check blocks
                const blocked = (blocks || []).some(b => {
                    if (b.professional_id !== pro.id) return false
                    const bStart = new Date(b.start_datetime)
                    const bEnd = new Date(b.end_datetime)
                    return isBefore(slotStart, bEnd) && isAfter(slotEnd, bStart)
                })

                if (blocked) {
                    slotStart = addMinutes(slotStart, stepMin)
                    continue
                }

                // Check existing bookings
                const booked = (bookings || []).some(b => {
                    if (b.professional_id !== pro.id) return false
                    const bStart = new Date(b.start_datetime)
                    const bEnd = new Date(b.end_datetime)
                    return isBefore(slotStart, bEnd) && isAfter(slotEnd, bStart)
                })

                if (!booked) {
                    allSlots.add(format(slotStart, 'HH:mm'))
                }

                slotStart = addMinutes(slotStart, stepMin)
            }
        }

        result[dateStr] = Array.from(allSlots).sort()
    }

    return result
}
