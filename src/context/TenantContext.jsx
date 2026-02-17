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
                setTenant(null) // Main domain
                setLoading(false)
                return
            }

            try {
                const { data, error: fetchError } = await supabase
                    .from('tenants')
                    .select('*')
                    .eq('slug', slug)
                    .single()

                if (fetchError) throw fetchError
                setTenant(data)
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
