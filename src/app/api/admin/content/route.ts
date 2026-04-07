import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(request: Request) {
    // 1. Verify Admin Auth
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    try {
        const { id, topicCode, moduleId, topicTitle, contentType, contentLink } = await request.json();

        // 2. Validate input
        if (!moduleId || !topicTitle || !contentType || !contentLink) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 3. Upsert into syllabus_content
        const updateData: any = {
            topic_code: topicCode || `DYN-${Date.now()}`,
            module_id: moduleId,
            title: topicTitle,
            content_type: contentType,
            content: contentLink,
            updated_at: new Date().toISOString()
        };

        if (id) updateData.id = id;

        const { data, error } = await supabaseAdmin
            .from('syllabus_content')
            .upsert(updateData)
            .select();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Content architecture updated successfully',
            data: data[0]
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// Optional: GET to list all added content for management
export async function GET(request: Request) {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) return auth.response;

    const { data, error } = await supabaseAdmin
        .from('syllabus_content')
        .select('*')
        .order('module_id', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}
