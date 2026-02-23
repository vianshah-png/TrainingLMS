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

        // 2. Create the profile in the profiles table
        if (userId) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: userId,
                    email,
                    full_name: fullName,
                    role: role || 'counsellor',
                    training_buddy: trainingBuddy || '',
                    temp_password: password,
                    phone: phone || null
                });

            if (profileError) {
                console.error('Profile creation error:', profileError);
                return NextResponse.json({ error: 'Auth user created but profile synchronization failed.' }, { status: 500 });
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
