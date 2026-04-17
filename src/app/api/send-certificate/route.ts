import { NextResponse } from 'next/server';
import { mailer, SENDER_EMAIL } from '@/lib/mail';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
    try {
        const { userId, userName, userEmail, completionDate, certificateId } = await request.json();

        if (!userEmail || !userName) {
            return NextResponse.json({ error: 'Missing user details' }, { status: 400 });
        }

        // Save certification record
        if (userId) {
            try {
                await supabaseAdmin.from('certification_attempts').insert([{
                    user_id: userId,
                    score: 100,
                    full_feedback: 'Training program completed successfully. Certificate issued.',
                    answers: { certificateId, completionDate },
                    status: 'training_complete'
                }]);
            } catch (dbErr) {
                console.warn('Certificate DB save warning:', dbErr);
            }

            // Log activity
            try {
                await supabaseAdmin.from('mentor_activity_logs').insert([{
                    user_id: userId,
                    activity_type: 'CERTIFICATE_ISSUED',
                    content_title: `Training Certificate: ${certificateId}`,
                    module_id: 'System'
                }]);
            } catch (logErr) {
                console.warn('Certificate activity log warning:', logErr);
            }
        }

        // Send certificate email
        const payload = {
            from: `BN Academy <${SENDER_EMAIL}>`,
            to: [userEmail],
            cc: ['workwithus@balancenutrition.in'],
            replyTo: SENDER_EMAIL,
            subject: `🎉 Congratulations ${userName}! Your BN Training Certificate is Ready`,
            html: `
                <div style="font-family: Georgia, serif; padding: 0; margin: 0; background-color: #FAFCEE;">
                    <div style="max-width: 620px; margin: 0 auto; padding: 40px;">
                        
                        <!-- Header -->
                        <div style="text-align: center; padding-bottom: 30px; border-bottom: 3px solid #00B6C1; margin-bottom: 30px;">
                            <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3em; color: #00B6C1;">BN ACADEMY · CERTIFICATE OF COMPLETION</p>
                            <h1 style="margin: 0; font-size: 32px; font-weight: normal; color: #0E5858;">Congratulations, ${userName}! 🎉</h1>
                        </div>

                        <!-- Certificate Card -->
                        <div style="background: white; border-radius: 20px; padding: 40px; border: 1px solid rgba(14,88,88,0.08); box-shadow: 0 4px 20px rgba(14,88,88,0.05); margin-bottom: 30px; text-align: center;">
                            
                            <!-- Award Badge -->
                            <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #FFCC00, #F5A623); margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 40px; color: white;">★</span>
                            </div>

                            <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: #00B6C1;">Balance Nutrition</p>
                            <h2 style="margin: 0 0 20px 0; font-size: 28px; color: #0E5858; font-weight: normal;">Certificate of Completion</h2>
                            
                            <p style="font-size: 15px; color: #666; margin: 0 0 10px 0;">This certifies that</p>
                            <h3 style="margin: 0 0 5px 0; font-size: 32px; color: #0E5858; font-weight: bold; border-bottom: 2px solid #00B6C1; display: inline-block; padding-bottom: 5px;">${userName}</h3>
                            
                            <p style="font-size: 15px; color: #666; margin: 20px 0 8px 0;">has successfully completed the</p>
                            <p style="font-size: 18px; color: #0E5858; font-weight: bold; margin: 0 0 20px 0;">BN Counsellor Training Program</p>
                            
                            <p style="font-size: 13px; color: #888; line-height: 1.6; margin: 0 0 25px 0;">
                                Achieving proficiency in nutrition counselling, sales methodology,<br/>
                                and Balance Nutrition operational protocols.
                            </p>

                            <!-- Details -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; border-top: 1px solid #f0f0f0; padding-top: 20px;">
                                <tr>
                                    <td style="text-align: center; padding: 10px;">
                                        <p style="margin: 0; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #aaa;">Completion Date</p>
                                        <p style="margin: 6px 0 0 0; font-size: 16px; font-weight: bold; color: #0E5858;">${completionDate}</p>
                                    </td>
                                    <td style="text-align: center; padding: 10px; border-left: 1px solid #f0f0f0;">
                                        <p style="margin: 0; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #aaa;">Certificate ID</p>
                                        <p style="margin: 6px 0 0 0; font-size: 16px; font-weight: bold; color: #0E5858;">${certificateId}</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="font-style: italic; font-size: 16px; color: #0E5858; margin: 10px 0 5px 0;">Khyati Rupani</p>
                            <p style="font-size: 12px; color: #888; margin: 0;">Founder & Chief Nutritionist</p>
                        </div>

                        <!-- CTA -->
                        <div style="text-align: center; margin-bottom: 30px;">
                            <p style="font-size: 14px; color: #555; margin: 0 0 15px 0;">
                                Log into your dashboard to download the full certificate and explore the <strong>Educators Module</strong> — your new content CRM tool.
                            </p>
                            <a href="https://lms-mentors-counsellors.vercel.app/" style="display: inline-block; background-color: #0E5858; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em;">
                                Open Dashboard →
                            </a>
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; color: #bbb; font-size: 11px; line-height: 1.7; border-top: 1px solid #eee; padding-top: 20px;">
                            <p style="margin: 0;">This is an automated certificate from the BN Internal Training Academy.</p>
                            <p style="margin: 6px 0 0 0; font-weight: bold; color: #00B6C1;">www.balancenutrition.in · BN Academy</p>
                        </div>
                    </div>
                </div>
            `,
        };

        console.log(`\n[EMAIL LOGGER - CERTIFICATE DISPATCH]`);
        console.log(`-> To: ${userEmail} (${userName})`);
        console.log(`-> Certificate ID: ${certificateId}`);
        console.log(`-> CC: workwithus@balancenutrition.in`);

        const info = await mailer.sendMail(payload);
        console.log(`-> Certificate email sent! Message ID: ${info?.messageId}\n`);

        return NextResponse.json({ success: true, messageId: info?.messageId });
    } catch (err: any) {
        console.error('[CERTIFICATE EMAIL ERROR]:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
