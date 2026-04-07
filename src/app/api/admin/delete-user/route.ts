import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(request: Request) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // 1. Delete from profiles table (Foreign keys might handle others, but let's be safe)
        // Note: If you have foreign keys with ON DELETE CASCADE, deleting from profiles or auth.users is enough.

        // 2. Delete from Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            // If user doesn't exist in auth but exists in profiles, we still want to clean up profiles
            console.warn('Auth deletion error (might not exist):', authError.message);
        }

        // 3. Delete from profiles (just in case cascade didn't catch it or for cleanup)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profileError) {
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Account permanently deleted' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
