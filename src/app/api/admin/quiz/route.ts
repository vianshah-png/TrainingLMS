import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const topicCode = searchParams.get('topicCode');

    if (!topicCode) {
        return NextResponse.json({ error: 'Missing topicCode' }, { status: 400 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('admin_quizzes')
            .select('*')
            .eq('topic_code', topicCode)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is code for no rows found
            throw error;
        }

        return NextResponse.json({ quiz: data || null });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    try {
        const { topicCode, questions } = await request.json();

        if (!topicCode || !questions || !Array.isArray(questions)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('admin_quizzes')
            .upsert({
                topic_code: topicCode,
                questions,
                updated_at: new Date().toISOString()
            }, { onConflict: 'topic_code' })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, quiz: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    const { searchParams } = new URL(request.url);
    const topicCode = searchParams.get('topicCode');

    if (!topicCode) {
        return NextResponse.json({ error: 'Missing topicCode' }, { status: 400 });
    }

    try {
        const { error } = await supabaseAdmin
            .from('admin_quizzes')
            .delete()
            .eq('topic_code', topicCode);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
