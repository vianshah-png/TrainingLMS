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
        const { userId, title, message, type, channel, template, interactionPayload } = await request.json();

        if (!userId || !title || !message) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const results: { dashboard?: boolean; email?: boolean; whatsapp?: string } = {};
        let notificationId: string | undefined;

        // --- Channel: Dashboard (in-app notification) ---
        if (!channel || channel === 'dashboard' || channel === 'all') {
            const { data: newNotif, error } = await supabaseAdmin
                .from('notifications')
                .insert([{
                    user_id: userId,
                    title,
                    message,
                    type: type || 'info',
                    template: template || 'none',
                    interaction_payload: interactionPayload || {}
                }])
                .select()
                .single();

            if (error) throw error;
            notificationId = newNotif?.id;
            results.dashboard = true;

            // Log the activity
            await supabaseAdmin
                .from('mentor_activity_logs')
                .insert([{
                    user_id: userId,
                    activity_type: 'ADMIN_NOTIFICATION',
                    content_title: title,
                    module_id: 'System'
                }]);
        }

        // --- Channel: Email (via Nodemailer) ---
        if (channel === 'email' || channel === 'all') {
            // Get user email from profile
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('email, full_name, role, training_buddy')
                .eq('id', userId)
                .single();

            if (profile?.email) {
                try {
                    const { mailer, SENDER_EMAIL } = await import('@/lib/mail');

                    let htmlContent = `
                        <div style="font-family: Georgia, serif; padding: 40px; color: #0E5858; max-width: 600px; margin: auto; background-color: #FAFCEE;">
                            <div style="border-bottom: 2px solid #00B6C1; padding-bottom: 20px; margin-bottom: 30px;">
                                <p style="margin: 0; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.25em; color: #00B6C1;">BN Academy Update</p>
                                <h2 style="margin: 10px 0 0 0; font-size: 24px; font-weight: normal; color: #0E5858;">${title}</h2>
                            </div>
                            
                            <div style="background: white; padding: 30px; border-radius: 24px; border: 1px solid rgba(14,88,88,0.1); box-shadow: 0 10px 30px rgba(14,88,88,0.05); margin-bottom: 30px;">
                                <p style="font-size: 15px; line-height: 1.8; color: #333; margin: 0;">
                                    Hello <strong>${profile.full_name || 'Counsellor'}</strong>,<br/><br/>
                                    ${message.replace(/\n/g, '<br/>')}
                                </p>

                                ${template === 'feedback' ? `
                                <div style="margin-top: 28px; background: #f8fffe; border: 2px dashed #00B6C1; border-radius: 16px; padding: 24px;">
                                    <p style="font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #00B6C1; margin: 0 0 12px 0;">📩 We'd love your feedback</p>
                                    <p style="font-size: 14px; color: #0E5858; line-height: 1.7; margin: 0 0 14px 0;">
                                      To share your thoughts, simply <strong>reply to this email</strong> with:
                                    </p>
                                    <ol style="font-size: 13px; color: #555; line-height: 1.9; padding-left: 20px; margin: 0 0 12px 0;">
                                      <li>A <strong>rating from 1 to 5</strong> (e.g. "Rating: 4")</li>
                                      <li>Any <strong>additional comments or suggestions</strong> you'd like to share</li>
                                    </ol>
                                    <p style="font-size: 12px; color: #aaa; margin: 0; font-style: italic;">Example reply: "Rating: 4 — Great content, but could use more practical examples."</p>
                                </div>
                                ` : ''}
                            </div>
                    `;

                    // SPECIAL LOGIC: Aggregated Report for Trainer Buddies
                    if (template === 'buddy_report') {
                        const { data: allProfiles } = await supabaseAdmin.from('profiles').select('*');
                        const myCounsellors = (allProfiles || []).filter(p => {
                            try {
                                const buddies = JSON.parse(p.training_buddy || '[]');
                                return (Array.isArray(buddies) ? buddies : [buddies]).some((b: any) => b.email?.toLowerCase() === profile.email.toLowerCase());
                            } catch {
                                return p.training_buddy?.toLowerCase().includes(profile.email.toLowerCase());
                            }
                        });

                        if (myCounsellors.length > 0) {
                            const counselorIds = myCounsellors.map(c => c.id);
                            const [assessments, activityLogs, progress] = await Promise.all([
                                supabaseAdmin.from('assessment_logs').select('*').in('user_id', counselorIds).order('created_at', { ascending: false }),
                                supabaseAdmin.from('mentor_activity_logs').select('*').in('user_id', counselorIds).order('created_at', { ascending: false }),
                                supabaseAdmin.from('mentor_progress').select('*').in('user_id', counselorIds).order('completed_at', { ascending: false })
                            ]);

                            htmlContent += `
                                <div style="margin-top: 30px;">
                                    <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #0E5858; border-bottom: 2px solid #00B6C1; padding-bottom: 10px; margin-bottom: 20px;">Counsellor Performance Overview</h3>
                                    ${myCounsellors.map(c => {
                                const cAssessments = (assessments.data || []).filter(a => a.user_id === c.id).slice(0, 3);
                                const cActivity = (activityLogs.data || []).filter(a => a.user_id === c.id).slice(0, 3);
                                const cProgressCount = (progress.data || []).filter(p => p.user_id === c.id).length;

                                return `
                                            <div style="background: white; border-radius: 12px; border: 1px solid #0E585810; padding: 20px; margin-bottom: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                                                <p style="margin:0; font-size: 16px; font-weight: bold; color: #0E5858;">${c.full_name}</p>
                                                <p style="margin: 2px 0 15px 0; font-size: 11px; color: #999;">${c.email}</p>
                                                
                                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                                                    <div style="background: #F9FAFB; padding: 10px; border-radius: 8px;">
                                                        <p style="margin:0; font-size: 8px; color: #999; text-transform: uppercase; font-weight: 900;">Progress</p>
                                                        <p style="margin:2px 0 0 0; font-size: 13px; font-weight: bold;">${cProgressCount} Topics Done</p>
                                                    </div>
                                                    <div style="background: #F9FAFB; padding: 10px; border-radius: 8px;">
                                                        <p style="margin:0; font-size: 8px; color: #999; text-transform: uppercase; font-weight: 900;">Last Quiz</p>
                                                        <p style="margin:2px 0 0 0; font-size: 13px; font-weight: bold; color: #00B6C1;">${cAssessments[0] ? `${Math.round((cAssessments[0].score / cAssessments[0].total_questions) * 100)}%` : 'N/A'}</p>
                                                    </div>
                                                </div>

                                                <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 900; color: #0E585850; text-transform: uppercase;">Recent Activity</p>
                                                <ul style="margin: 0; padding: 0; list-style: none;">
                                                    ${cActivity.length > 0 ? cActivity.map(a => `
                                                        <li style="font-size: 11px; color: #555; margin-bottom: 4px; padding-left: 10px; border-left: 2px solid #00B6C120;">
                                                            ${a.content_title || a.topic_code}
                                                        </li>
                                                    `).join('') : '<li style="font-size: 11px; color: #999;">No recent activity</li>'}
                                                </ul>
                                            </div>
                                        `;
                            }).join('')}
                                </div>
                            `;
                        } else {
                            htmlContent += `<p style="font-size: 13px; color: #999; font-style: italic;">No counsellors are currently assigned to your mentorship list.</p>`;
                        }
                    }

                    // SPECIAL LOGIC: Direct Report of a single user SHARE TO BUDDY
                    if (template === 'direct_report') {
                        const [assessments, activityLogs, progress] = await Promise.all([
                            supabaseAdmin.from('assessment_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
                            supabaseAdmin.from('mentor_activity_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
                            supabaseAdmin.from('mentor_progress').select('*').eq('user_id', userId).order('completed_at', { ascending: false })
                        ]);

                        const cAssessments = (assessments.data || []).slice(0, 5);
                        const cActivity = (activityLogs.data || []).slice(0, 10);
                        const cProgressCount = (progress.data || []).length;

                        htmlContent += `
                            <div style="margin-top: 30px;">
                                <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #0E5858; border-bottom: 2px solid #00B6C1; padding-bottom: 10px; margin-bottom: 20px;">Individual Performance Report</h3>
                                <div style="background: white; border-radius: 12px; border: 1px solid #0E585810; padding: 20px; margin-bottom: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                                    <p style="margin:0; font-size: 16px; font-weight: bold; color: #0E5858;">${profile.full_name}</p>
                                    <p style="margin: 2px 0 15px 0; font-size: 11px; color: #999;">${profile.email}</p>
                                    
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                                        <div style="background: #F9FAFB; padding: 10px; border-radius: 8px;">
                                            <p style="margin:0; font-size: 8px; color: #999; text-transform: uppercase; font-weight: 900;">Total Topics</p>
                                            <p style="margin:2px 0 0 0; font-size: 13px; font-weight: bold;">${cProgressCount} Modules Completed</p>
                                        </div>
                                        <div style="background: #F9FAFB; padding: 10px; border-radius: 8px;">
                                            <p style="margin:0; font-size: 8px; color: #999; text-transform: uppercase; font-weight: 900;">Latest Assessment</p>
                                            <p style="margin:2px 0 0 0; font-size: 13px; font-weight: bold; color: #00B6C1;">${cAssessments[0] ? `${Math.round((cAssessments[0].score / cAssessments[0].total_questions) * 100)}%` : 'Not Attempted'}</p>
                                        </div>
                                    </div>

                                    <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 900; color: #0E585850; text-transform: uppercase;">Recent Activity Trail</p>
                                    <ul style="margin: 0; padding: 0; list-style: none;">
                                        ${cActivity.length > 0 ? cActivity.map(a => `
                                            <li style="font-size: 11px; color: #555; margin-bottom: 6px; padding-left: 10px; border-left: 2px solid #00B6C140;">
                                                <strong>${a.activity_type.replace('_', ' ')}</strong>: ${a.content_title || a.topic_code}
                                                <span style="display:block; font-size: 9px; color: #999;">${new Date(a.created_at).toLocaleString()}</span>
                                            </li>
                                        `).join('') : '<li style="font-size: 11px; color: #999;">No activity recorded</li>'}
                                    </ul>
                                </div>
                            </div>
                        `;
                    }

                    htmlContent += `
                            <div style="text-align: center; border-top: 1px solid rgba(14,88,88,0.05); padding-top: 30px; margin-top: 30px;">
                                <p style="font-size: 11px; color: #999; margin: 0;">This is an official academy notification from Balance Nutrition.</p>
                                <p style="font-size: 10px; color: #00B6C1; margin-top: 10px; font-weight: bold;">Counsellor Mastery Portal</p>
                            </div>
                        </div>
                    `;

                    let recipients = [profile.email];
                    if (template === 'direct_report') {
                        try {
                            const buddies = JSON.parse(profile.training_buddy || '[]');
                            const buddiesArray = Array.isArray(buddies) ? buddies : [buddies];
                            const buddyEmails = buddiesArray.map((b: any) => b.email).filter(Boolean);
                            if (buddyEmails.length > 0) {
                                recipients = buddyEmails; // Send to buddies instead of the user
                            }
                        } catch (err: any) {
                            // Fallback for legacy comma emails
                            const emails = (profile.training_buddy || '').split(',').map((email: string) => email.trim()).filter((email: string) => email.includes('@'));
                            if (emails.length > 0) recipients = emails;
                        }
                    }

                    await mailer.sendMail({
                        from: `BN Academy <${SENDER_EMAIL}>`,
                        to: recipients,
                        cc: ['workwithus@balancenutrition.in'],
                        subject: title,
                        html: htmlContent
                    });
                    results.email = true;
                } catch (emailErr: any) {
                    console.error('Email send failed:', emailErr);
                    results.email = false;
                }
            }
        }

        // --- Channel: WhatsApp (generate link) ---
        if (channel === 'whatsapp' || channel === 'all') {
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('phone, full_name')
                .eq('id', userId)
                .single();

            if (profile?.phone) {
                const cleanPhone = profile.phone.replace(/[^0-9]/g, '');
                const waText = encodeURIComponent(`*${title}*\n\n${message}\n\n— BN Academy`);
                results.whatsapp = `https://wa.me/${cleanPhone}?text=${waText}`;
            } else if (channel === 'whatsapp') {
                return NextResponse.json({ error: 'No phone number found for this user.' }, { status: 400 });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    // This is for users to mark as read OR record an interaction
    try {
        const { id, isRead, interactionResponse } = await request.json();

        const updateData: any = {};
        if (typeof isRead === 'boolean') updateData.is_read = isRead;
        if (interactionResponse) updateData.interaction_response = interactionResponse;

        const { data, error } = await supabaseAdmin
            .from('notifications')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, notification: data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
