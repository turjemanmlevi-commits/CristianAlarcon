import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nzeblijzontrmizefssh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56ZWJsaWp6b250cm1pemVmc3NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMzMxOTUsImV4cCI6MjA4NjkwOTE5NX0.rLltqjuk5r-iuvDXZLBwTknQRZohPqk_o9viWn75_bA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
