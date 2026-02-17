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
                // En el dominio raíz (sin subdominio), mostramos la plataforma principal
                setTenant(null)
                setLoading(false)
                return
            }

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
                    // Fallback a Cristian si el subdominio no existe o falla
                    console.warn('No tenant found for slug:', slug, 'Falling back to Cristian.')
                    const { data: defaultTenant } = await supabase
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
