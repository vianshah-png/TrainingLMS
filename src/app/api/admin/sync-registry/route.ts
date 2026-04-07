import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(request: Request) {
    // 1. Verify admin authorization
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    try {
        console.log("Master Sync Protocol Initiated...");

        // 2. Fetch all Auth users with full metadata
        const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
        if (authError) throw authError;

        // 3. Perform a bulk-sync with the profiles table
        const syncResults = await Promise.all(
            authUsers.map(async (user) => {
                const metadata = user.user_metadata || {};

                // Fetch existing profile to see if we need to supplement it
                const { data: existingProfile } = await supabaseAdmin
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (!existingProfile) {
                    // Create new profile if missing
                    const { error } = await supabaseAdmin
                        .from('profiles')
                        .insert([{
                            id: user.id,
                            email: user.email,
                            full_name: metadata.full_name || metadata.fullName || user.email?.split('@')[0],
                            role: metadata.role || 'counsellor',
                            phone: user.phone || metadata.phone || "",
                            temp_password: metadata.temp_password || "" // Only if in auth metadata
                        }]);
                    return { email: user.email, success: !error, type: 'insert' };
                } else {
                    // Update only if critical fields are empty
                    const updates: any = {};
                    if (!existingProfile.full_name && (metadata.full_name || metadata.fullName)) {
                        updates.full_name = metadata.full_name || metadata.fullName;
                    }
                    if (!existingProfile.phone && (user.phone || metadata.phone)) {
                        updates.phone = user.phone || metadata.phone;
                    }

                    if (Object.keys(updates).length > 0) {
                        const { error } = await supabaseAdmin
                            .from('profiles')
                            .update(updates)
                            .eq('id', user.id);
                        return { email: user.email, success: !error, type: 'update' };
                    }
                    return { email: user.email, success: true, type: 'skipped' };
                }
            })
        );

        const successCount = syncResults.filter(r => r.success).length;

        // 4. Log activity
        await supabaseAdmin.from('mentor_activity_logs').insert([{
            user_id: auth.userId,
            activity_type: 'system_sync',
            content_title: `Synchronized ${successCount} profiles from Auth Master`,
            module_id: 'System'
        }]);

        return NextResponse.json({
            success: true,
            message: `Registry synchronized: ${successCount} profiles updated.`,
            count: successCount
        });

    } catch (err: any) {
        console.error('Sync API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
