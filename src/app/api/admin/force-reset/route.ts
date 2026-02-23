import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdmin } from '@/lib/admin-auth';

// ADMIN CLIENT (Uses Service Role Key)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(request: Request) {
    // Server-side admin check
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;
    const counsellors = [
        { name: 'Shivani', email: 'priya.k@balancenutrition.in' },
        { name: 'Vikram Joshi', email: 'vikram.j@balancenutrition.in' },
        { name: 'BN Admin', email: 'workwithus@balancenutrition.in' }
    ];

    const results = [];

    for (const counsellor of counsellors) {
        try {
            // 1. Try to find the user first
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = users?.find(u => u.email === counsellor.email);

            let userId;

            if (existingUser) {
                // 2. Update existing user's password to 515148
                const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                    existingUser.id,
                    { password: '515148', email_confirm: true }
                );
                if (updateError) throw updateError;
                userId = existingUser.id;
            } else {
                // 3. Create brand new user
                const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: counsellor.email,
                    password: '515148',
                    email_confirm: true,
                    user_metadata: { full_name: counsellor.name }
                });
                if (createError) throw createError;
                userId = created.user?.id;
            }

            // 4. Ensure profile exists
            if (userId) {
                await supabaseAdmin.from('profiles').upsert({
                    id: userId,
                    email: counsellor.email,
                    full_name: counsellor.name,
                    role: 'counsellor'
                });
            }

            results.push({ email: counsellor.email, status: 'synced' });
        } catch (err: any) {
            results.push({ email: counsellor.email, status: 'error', message: err.message });
        }
    }

    return NextResponse.json({ success: true, results });
}
