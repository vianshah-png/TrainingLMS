import { NextResponse } from 'next/server';
import { mailer, SENDER_EMAIL } from '@/lib/mail';

export async function POST(request: Request) {
    try {
        const { mentorName, mentorEmail, counselorEmail, counselorName } = await request.json();

        if (!mentorEmail || !mentorName) {
            return NextResponse.json({ error: 'Missing mentor details' }, { status: 400 });
        }

        const payload = {
            from: `BN Academy <${SENDER_EMAIL}>`,
            to: [mentorEmail],
            cc: ['workwithus@balancenutrition.in'],
            replyTo: counselorEmail || SENDER_EMAIL,
            subject: `Request for Mock Call`,
            html: `
                <div style="font-family: Georgia, serif; color: #0E5858; padding: 40px; background-color: #FAFCEE; max-width: 600px; margin: 0 auto;">
                    <div style="border-bottom: 2px solid #00B6C1; padding-bottom: 20px; margin-bottom: 30px;">
                        <p style="font-size: 11px; font-weight: bold; color: #00B6C1; text-transform: uppercase; letter-spacing: 0.2em; margin: 0 0 8px 0;">BN Academy · Mock Call Request</p>
                        <h2 style="font-size: 28px; margin: 0; color: #0E5858;">Schedule a Mock Call</h2>
                    </div>

                    <p style="font-size: 16px; line-height: 1.7; color: #333;">
                        Hi <strong>${mentorName}</strong>,
                    </p>

                    <div style="background-color: white; padding: 25px 30px; border-radius: 20px; border: 1px solid rgba(14,88,88,0.1); margin: 24px 0;">
                        <p style="font-size: 15px; color: #333; line-height: 1.8; margin: 0;">
                            ${counselorName ? `<strong>${counselorName}</strong> has` : 'A counselor has'} requested to schedule a mock call with you through the BN Learning Platform.
                        </p>
                        <p style="font-size: 14px; color: #666; margin: 16px 0 0 0; line-height: 1.7;">
                            Please get in touch with them directly to confirm a suitable time slot.
                            ${counselorEmail ? `<br/>You can reply to this email to reach them at <a href="mailto:${counselorEmail}" style="color: #00B6C1;">${counselorEmail}</a>.` : ''}
                        </p>
                    </div>

                    <p style="font-size: 12px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                        This is an automated notification from the Balance Nutrition Internal Training Academy.<br/>
                        <span style="color: #00B6C1;">workwithus@balancenutrition.in</span> has been CC'd on this email.
                    </p>
                </div>
            `,
        };

        console.log(`\n[EMAIL LOGGER - MOCK CALL REQUEST]`);
        console.log(`-> To: ${mentorEmail} (${mentorName})`);
        console.log(`-> From counselor: ${counselorEmail || 'unknown'}`);
        console.log(`-> CC: workwithus@balancenutrition.in`);

        const info = await mailer.sendMail(payload);
        console.log(`-> Sent! Message ID: ${info?.messageId}\n`);

        return NextResponse.json({ success: true, messageId: info?.messageId });
    } catch (err: any) {
        console.error('[MOCK CALL EMAIL ERROR]:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
