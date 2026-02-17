import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pjwucakxqubrvbuzvidn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqd3VjYWt4cXVicnZidXp2aWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDY2MDAsImV4cCI6MjA4NTg4MjYwMH0.9QMp2cWnnFlis8hKUJyoJkbt2nNp4N8b7GtPSwDr5UQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
