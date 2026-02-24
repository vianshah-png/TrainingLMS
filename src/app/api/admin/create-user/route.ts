import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(request: Request) {

    // Server-side admin check
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    try {
        const { email, password, fullName, role, trainingBuddy, phone } = await request.json();

        if (!email || !password || !fullName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 0. Check for existing auth user with this email
        const { data: { users: existingUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) throw listError;

        const existingAuthUser = existingUsers.find(u => u.email === email);
        if (existingAuthUser) {
            // Check if this auth user has a profile
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('id', existingAuthUser.id)
                .single();

            if (!profile) {
                // Orphaned account found! Delete it so we can re-create it.
                console.log(`Deleting orphaned auth user: ${email} (${existingAuthUser.id})`);
                await supabaseAdmin.auth.admin.deleteUser(existingAuthUser.id);
            } else {
                // Active profile exists, cannot re-create
                return NextResponse.json({ error: 'An active account with this email already exists in the registry.' }, { status: 400 });
            }
        }

        // 1. Create the user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: role || 'counsellor',
                training_buddy: trainingBuddy || ''
            }
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        const userId = authData.user?.id;

        // 2. Create or update the profile in the profiles table
        if (userId) {
            // Map roles to match database check constraints
            // The database currently only allows 'mentor' and 'admin'
            let dbRole = role || 'mentor';
            if (dbRole === 'counsellor') dbRole = 'mentor';
            if (!['mentor', 'admin'].includes(dbRole)) {
                dbRole = 'mentor'; // Safe fallback
            }

            const profileData: any = {
                id: userId,
                email,
                full_name: fullName,
                role: dbRole,
                training_buddy: trainingBuddy || '[]',
                temp_password: password
            };

            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert(profileData);

            if (profileError) {
                console.error('Profile synchronization error:', profileError);

                let errorMessage = profileError.message;
                if (errorMessage.includes('profiles_role_check')) {
                    errorMessage = "The system role check failed. This usually means the database needs an update to support new role names. For now, try using the 'Counsellor' role which maps to 'mentor'.";
                }

                return NextResponse.json({
                    error: `Auth user created but profile synchronization failed: ${errorMessage}`,
                    details: profileError
                }, { status: 500 });
            }

            // 3. Initialize progress tracking activity
            await supabaseAdmin.from('mentor_activity_logs').insert([{
                user_id: userId,
                activity_type: 'signup',
                content_title: 'Account Provisioned by Admin',
                module_id: 'System'
            }]);
        }

        return NextResponse.json({
            success: true,
            user: {
                id: userId,
                email,
                fullName
            }
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
