import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Verifies the calling user is an authenticated admin.
 * 
 * Expects the access token in the Authorization header as:
 *   Authorization: Bearer <access_token>
 * 
 * Checks the `profiles` table for role === 'admin'.
 */
export async function verifyAdmin(request: Request): Promise<
    | { authorized: true; userId: string; email: string; role: string }
    | { authorized: false; response: NextResponse }
> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        return {
            authorized: false,
            response: NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            ),
        };
    }

    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
        return {
            authorized: false,
            response: NextResponse.json(
                { error: 'Not authenticated. Please log in.' },
                { status: 401 }
            ),
        };
    }

    // Create a client with the user's access token to verify identity
    const supabaseUser = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !user) {
        return {
            authorized: false,
            response: NextResponse.json(
                { error: 'Session expired. Please log in again.' },
                { status: 401 }
            ),
        };
    }

    // Now check the profiles table using the admin client (server-side truth)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        return {
            authorized: false,
            response: NextResponse.json(
                { error: 'User profile not found.' },
                { status: 403 }
            ),
        };
    }

    const allowedRoles = ['admin', 'trainer buddy', 'nutripreneur', 'counsellor', 'mentor'];
    if (!allowedRoles.includes(profile.role)) {
        return {
            authorized: false,
            response: NextResponse.json(
                { error: 'Insufficient permissions. Access required.' },
                { status: 403 }
            ),
        };
    }

    return {
        authorized: true,
        userId: user.id,
        email: user.email || '',
        role: profile.role
    };
}
