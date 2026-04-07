import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
    if (typeof window === 'undefined') {
        console.warn("SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations will fail.");
    }
}

// Admin client (Bypasses RLS - use only for server-side auth/admin tasks)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
