import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {

    try {
        const { userId, email, fullName } = await req.json();

        if (!userId || !email) {
            return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
        }

        // Check for existing profile to avoid overwriting admin-set data (phone, training_buddy)
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        let data, error;
        if (!existingProfile) {
            // Create new profile if it doesn't exist
            const result = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: userId,
                    email: email,
                    full_name: fullName || email.split('@')[0],
                    role: 'mentor'
                })
                .select()
                .single();
            data = result.data;
            error = result.error;
        } else {
            // Profile exists, maybe update basic info if needed, but DO NOT overwrite phone/buddy
            data = existingProfile;
        }

        if (error) {
            console.error('Admin Profile Sync Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, profile: data });
    } catch (err: any) {
        console.error('Sync Profile Route Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
