import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getSubdomain } from '../utils/tenant'

const TenantContext = createContext()

export const TenantProvider = ({ children }) => {
    const [tenant, setTenant] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchTenant = async () => {
            // Si hay subdominio, úsalo; si no (dominio principal), carga 'reservabarbero'
            const slug = getSubdomain() || 'reservabarbero'

            try {
                const { data, error: fetchError } = await supabase
                    .from('tenants')
                    .select('*')
                    .eq('slug', slug)
                    .single()

                if (data) {
                    setTenant(data)
                    if (data.theme_color) {
                        document.documentElement.style.setProperty('--accent', data.theme_color)
                    }
                } else {
                    // Subdominio no encontrado → null (404)
                    console.warn('No tenant found for slug:', slug)
                    setTenant(null)
                }
            } catch (err) {
                console.error('Error fetching tenant:', err)
                setError(err)
            } finally {
                setLoading(false)
            }
        }

        fetchTenant()
    }, [])

    return (
        <TenantContext.Provider value={{ tenant, loading, error }}>
            {children}
        </TenantContext.Provider>
    )
}

export const useTenant = () => useContext(TenantContext)
