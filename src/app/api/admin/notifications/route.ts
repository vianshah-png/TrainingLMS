import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notifications: data });
}

export async function POST(request: Request) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    try {
        const { userId, title, message, type } = await request.json();

        if (!userId || !title || !message) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('notifications')
            .insert([{
                user_id: userId,
                title,
                message,
                type: type || 'info'
            }])
            .select()
            .single();

        if (error) throw error;

        // Log the activity
        await supabaseAdmin
            .from('mentor_activity_logs')
            .insert([{
                user_id: userId,
                activity_type: 'ADMIN_NOTIFICATION',
                content_title: title,
                module_id: 'System'
            }]);

        return NextResponse.json({ success: true, notification: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    // This is for users to mark as read
    try {
        const { id, isRead } = await request.json();

        const { data, error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: isRead })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, notification: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
