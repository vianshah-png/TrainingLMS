import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
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

        // 1. Create the user in Supabase Auth
        let userId: string | undefined;
        let isExistingUser = false;

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
            // Handle existing user conflict gracefully for profile synchronization
            if (authError.message.toLowerCase().includes('already registered') || authError.message.toLowerCase().includes('already exists')) {
                const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
                if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

                const existingUser = usersData.users.find((u: any) => u.email === email);
                if (existingUser) {
                    userId = existingUser.id;
                    isExistingUser = true;
                } else {
                    return NextResponse.json({ error: 'Identity conflict detected but user could not be mapped.' }, { status: 400 });
                }
            } else {
                return NextResponse.json({ error: authError.message }, { status: 400 });
            }
        } else {
            userId = authData.user?.id;
        }

        // 2. Create or update the profile in the profiles table
        if (userId) {
            // Using a more robust upsert approach
            const profileData: any = {
                id: userId,
                email,
                full_name: fullName,
                role: role || 'counsellor',
                training_buddy: trainingBuddy || '[]',
                temp_password: password
            };

            if (phone) profileData.phone = phone;

            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert(profileData);

            if (profileError) {
                console.error('Profile synchronization error:', profileError);
                return NextResponse.json({
                    error: `Auth confirmed but profile mapping failed: ${profileError.message}`
                }, { status: 500 });
            }

            // 3. Log Provisioning Activity
            await supabaseAdmin.from('mentor_activity_logs').insert([{
                user_id: userId,
                activity_type: 'signup',
                content_title: isExistingUser ? 'Account Re-provisioned / Synced' : 'Account Provisioned by Admin',
                module_id: 'System'
            }]);
        }

        return NextResponse.json({
            success: true,
            message: isExistingUser ? 'Profile synchronized with existing credentials.' : 'New account provisioned successfully.',
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
