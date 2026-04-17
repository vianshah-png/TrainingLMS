import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(request: Request) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    try {
        const { userId } = await request.json();
        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Tables to wipe for a fresh start
        const tables = [
            'mentor_activity_logs',
            'assessment_logs',
            'mentor_progress',
            'summary_audits',
            'simulation_logs',
            'certification_attempts',
            'notifications'
        ];

        for (const table of tables) {
            await supabaseAdmin.from(table).delete().eq('user_id', userId);
        }

        // Start fresh activity trail with a "Fresh Start" marker
        await supabaseAdmin.from('mentor_activity_logs').insert([{
            user_id: userId,
            activity_type: 'ACCOUNT_RESET',
            content_title: 'Account History Wiped - Fresh Start Initiated',
            module_id: 'SYSTEM',
            topic_code: 'RESTART'
        }]);

        return NextResponse.json({ success: true, message: 'History wiped successfully' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
