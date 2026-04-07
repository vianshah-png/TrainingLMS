import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(request: Request) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    try {
        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const res = await Promise.all([
            supabaseAdmin.from('mentor_activity_logs').delete().eq('user_id', userId),
            supabaseAdmin.from('mentor_progress').delete().eq('user_id', userId),
            supabaseAdmin.from('assessment_logs').delete().eq('user_id', userId),
            supabaseAdmin.from('summary_audits').delete().eq('user_id', userId)
        ]);

        const errors = res.filter(r => r.error);
        if (errors.length > 0) {
            console.error("Errors clearing history:", errors);
            throw new Error(errors[0].error?.message || "Failed to clear some tables");
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Clear History Error:", err);
        return NextResponse.json({ error: err.message || 'Failed to clear history' }, { status: 500 });
    }
}
