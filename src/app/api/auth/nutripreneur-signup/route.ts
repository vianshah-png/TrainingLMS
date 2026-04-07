import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    try {
        const { email, password, fullName } = await req.json();

        if (!email || !password || !fullName) {
            return NextResponse.json({ error: 'Email, password, and full name are required.' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
        }

        // Create the user via the admin client (no email verification)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName, role: 'nutripreneur' }
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        const userId = authData.user?.id;
        if (!userId) {
            return NextResponse.json({ error: 'User creation failed — no ID returned.' }, { status: 500 });
        }

        // Upsert the profile with role = 'nutripreneur'
        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
            id: userId,
            email: email,
            full_name: fullName,
            role: 'nutripreneur',
        }, { onConflict: 'id' });

        if (profileError) {
            console.error('Nutripreneur profile upsert failed:', profileError.message);
            // Non-fatal — user can still log in
        }

        return NextResponse.json({ success: true, message: 'Nutripreneur account created.' });

    } catch (error: any) {
        console.error('Nutripreneur signup error:', error);
        return NextResponse.json({ error: 'Internal server error during signup.' }, { status: 500 });
    }
}
