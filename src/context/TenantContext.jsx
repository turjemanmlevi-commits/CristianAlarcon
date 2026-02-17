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
            const slug = getSubdomain()

            if (!slug) {
                // Si no hay subdominio, cargamos la barbería de Cristian por defecto
                // para que la plataforma principal siempre tenga contenido visible.
                const { data: defaultTenant, error: defaultError } = await supabase
                    .from('tenants')
                    .select('*')
                    .eq('slug', 'barberiacristianalarcon')
                    .single()

                if (defaultTenant) {
                    setTenant(defaultTenant)
                    if (defaultTenant.theme_color) {
                        document.documentElement.style.setProperty('--accent', defaultTenant.theme_color)
                    }
                }
                setLoading(false)
                return
            }

            try {
                const { data, error: fetchError } = await supabase
                    .from('tenants')
                    .select('*')
                    .eq('slug', slug)
                    .single()

                if (fetchError) {
                    console.error('Error fetching tenant for slug:', slug, fetchError)
                    throw fetchError
                }

                if (!data) {
                    console.warn('No tenant found for slug:', slug)
                }

                setTenant(data)

                // Aplicar color de tema dinámico exclusivo para este subdominio
                if (data.theme_color) {
                    document.documentElement.style.setProperty('--accent', data.theme_color)
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
