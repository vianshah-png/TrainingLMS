import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
        }

        // Robust token extraction (case-insensitive "bearer")
        const token = authHeader.replace(/^Bearer /i, '').trim();

        if (!token) {
            return NextResponse.json({ error: 'Token is empty' }, { status: 401 });
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            console.error("Supabase Auth Error:", userError?.message || "User not found");
            return NextResponse.json({
                error: 'Invalid token',
                details: userError?.message || 'The provided token was not recognized by the Supabase project.'
            }, { status: 401 });
        }

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const ALLOWED_ROLES = ['admin', 'moderator', 'trainer buddy', 'buddy', 'tech', 'bd', 'cs'];
        if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
            console.warn(`Access denied for user ${user.id} with role: ${profile?.role}`);
            return NextResponse.json({ error: 'Unauthorized role', role: profile?.role }, { status: 403 });
        }

        const [
            { data: pData, error: pError },
            { data: aData, error: aError },
            { data: actData, error: actError },
            { data: audData, error: audError },
            { data: cData, error: cError },
            { data: prData, error: prError },
            { data: simData, error: simError }
        ] = await Promise.all([
            supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }),
            supabaseAdmin.from('assessment_logs').select('*').order('created_at', { ascending: false }),
            supabaseAdmin.from('mentor_activity_logs').select('*').order('created_at', { ascending: false }),
            supabaseAdmin.from('summary_audits').select('*').order('created_at', { ascending: false }),
            supabaseAdmin.from('syllabus_content').select('*').order('module_id', { ascending: true }),
            supabaseAdmin.from('mentor_progress').select('*').order('completed_at', { ascending: false }),
            supabaseAdmin.from('simulation_logs').select('*').order('created_at', { ascending: false })
        ]);

        if (pError || aError || prError) {
            console.error(pError, aError, prError);
            return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
        }

        return NextResponse.json({
            profiles: pData,
            assessments: aData,
            activities: actData,
            audits: audData,
            syllabus: cData,
            progress: prData,
            simulations: simData
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
