import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(request: Request) {
    // 1. Verify admin authorization
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    try {
        // 2. Fetch all Auth users
        const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        if (authError) throw authError;

        // 3. Fetch all Profile IDs
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id');
        if (profileError) throw profileError;

        const profileIds = new Set(profiles.map(p => p.id));

        // 4. Identify orphaned accounts (Auth users with no profile)
        // We exclude the current admin to be safe, though they should have a profile.
        const currentUserEmail = auth.email;
        const orphanedUsers = authUsers.filter(user =>
            !profileIds.has(user.id) &&
            user.email !== currentUserEmail &&
            user.email !== 'admin@balancenutrition.in' // Safety fallback for primary admin
        );

        if (orphanedUsers.length === 0) {
            return NextResponse.json({
                success: true,
                message: "No orphaned accounts found. System is clean.",
                cleanedCount: 0
            });
        }

        // 5. Delete orphaned users
        const results = await Promise.all(
            orphanedUsers.map(async (user) => {
                const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
                return { id: user.id, email: user.email, success: !error, error: error?.message };
            })
        );

        const successCount = results.filter(r => r.success).length;

        // 6. Log activity
        await supabaseAdmin.from('mentor_activity_logs').insert([{
            user_id: auth.userId,
            activity_type: 'system_cleanup',
            content_title: `Cleaned ${successCount} orphaned accounts`,
            module_id: 'System'
        }]);

        return NextResponse.json({
            success: true,
            message: `Successfully removed ${successCount} orphaned accounts.`,
            details: results,
            cleanedCount: successCount
        });

    } catch (err: any) {
        console.error('Cleanup API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
