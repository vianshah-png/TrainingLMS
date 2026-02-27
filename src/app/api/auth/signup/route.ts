import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { email, password, fullName } = await request.json();

        if (!email || !password || !fullName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Create the user in Supabase Auth with auto-confirm
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: 'counsellor'
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
                    role: 'counsellor',
                    temp_password: password,
                    created_at: new Date().toISOString()
                });

            if (profileError) {
                console.warn('Profile creation warning:', profileError.message);
            }

            // 3. Initialize progress tracking activity
            await supabaseAdmin.from('mentor_activity_logs').insert([{
                user_id: userId,
                activity_type: 'signup',
                content_title: 'Account Created',
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
