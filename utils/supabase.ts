import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://liykeqatktsxciieabws.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpeWtlcWF0a3RzeGNpaWVhYndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5OTY2NzIsImV4cCI6MjEwMTU3MjY3Mn0.-FJ5ZdhEoYETqUugqgIHckSpGSWp5TU2zHttSrmXag4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)