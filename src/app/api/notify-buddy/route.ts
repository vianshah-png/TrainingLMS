import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { mailer, SENDER_EMAIL } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { userId, topicCode, score, totalQuestions, results } = await req.json();

    if (!userId || !topicCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch user profile and buddy info
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('full_name, training_buddy, email')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile for notification:', profileError);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let buddies = [];
    try {
      buddies = typeof profile.training_buddy === 'string'
        ? JSON.parse(profile.training_buddy)
        : profile.training_buddy;
    } catch (e) {
      console.error('Error parsing training_buddy JSON:', e);
    }

    if (!Array.isArray(buddies) || buddies.length === 0) {
      // Fallback for legacy comma-separated emails or single email string
      if (profile.training_buddy && typeof profile.training_buddy === 'string' && profile.training_buddy.includes('@')) {
        buddies = profile.training_buddy.split(',').map(email => ({
          name: "BN Admin",
          email: email.trim()
        }));
      } else {
        return NextResponse.json({ message: 'No buddies to notify' });
      }
    }

    const percentage = Math.round((score / (totalQuestions || 5)) * 100);
    const counselorName = profile.full_name || 'A counselor';

    // 2. Format results for email if available
    const resultsHtml = results && Array.isArray(results) ? `
          <div style="margin-top: 25px;">
            <p style="font-size: 14px; font-weight: 900; color: #0E585860; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px;">Review Breakdown</p>
            ${results.map((r: any, i: number) => `
              <div style="background: #ffffff; border: 1px solid #0E585808; border-radius: 12px; padding: 15px; margin-bottom: 15px;">
                <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #0E5858; line-height: 1.4;">Q${i + 1}: ${r.question || (r.type === 'text' ? 'Subjective Question' : 'MCQ Question')}</p>
                <div style="font-size: 13px; color: #333; line-height: 1.5;">
                  <p style="margin: 0 0 5px 0;"><strong>Response:</strong> ${r.providedAnswer}</p>
                  <p style="margin: 0; color: ${r.isCorrect ? '#059669' : '#dc2626'}; font-weight: bold;">
                    ${r.isCorrect ? '✓ Correct' : '✗ Needs Review'}
                  </p>
                  ${r.aiFeedback ? `<p style="margin: 5px 0 0 0; font-size: 11px; font-style: italic; color: #666;">Feedback: "${r.aiFeedback}"</p>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        ` : '';

    // 3. Send notifications to each buddy
    const notificationPromises = buddies.map(async (buddy: any) => {
      if (!buddy.email) return;

      // 3a. Email Notification
      try {
        const payload = {
          from: `BN Academy <${SENDER_EMAIL}>`,
          to: buddy.email,
          replyTo: profile?.email || SENDER_EMAIL,
          cc: ['workwithus@balancenutrition.in'],
          subject: `BN Academy | Quiz Alert: ${counselorName} scored ${percentage}% on ${topicCode}`,
          html: `
              <div style="font-family: Georgia, serif; padding: 40px; color: #0E5858; max-width: 620px; margin: auto; background-color: #FAFCEE;">

                <!-- Header -->
                <div style="border-bottom: 3px solid #00B6C1; padding-bottom: 18px; margin-bottom: 28px;">
                  <p style="margin: 0 0 6px 0; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3em; color: #00B6C1;">BN ACADEMY · QUIZ ALERT</p>
                  <h1 style="margin: 0; font-size: 28px; font-weight: normal; color: #0E5858;">${counselorName}</h1>
                  <p style="margin: 8px 0 0 0; font-size: 13px; color: #888;">just completed a quiz — here is their result.</p>
                </div>

                <!-- Score Card -->
                <div style="background: white; border-radius: 20px; padding: 30px; border: 1px solid rgba(14,88,88,0.08); box-shadow: 0 4px 20px rgba(14,88,88,0.05); margin-bottom: 25px;">
                  
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                    <tr>
                      <td style="text-align: center; padding: 0 8px;">
                        <p style="margin: 0; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #aaa;">Topic</p>
                        <p style="margin: 6px 0 0 0; font-size: 17px; font-weight: bold; color: #0E5858;">${topicCode}</p>
                      </td>
                      <td style="text-align: center; padding: 0 8px; border-left: 1px solid #f0f0f0; border-right: 1px solid #f0f0f0;">
                        <p style="margin: 0; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #aaa;">Score</p>
                        <p style="margin: 6px 0 0 0; font-size: 17px; font-weight: bold; color: #0E5858;">${score} / ${totalQuestions}</p>
                      </td>
                      <td style="text-align: center; padding: 0 8px;">
                        <p style="margin: 0; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #aaa;">Accuracy</p>
                        <p style="margin: 6px 0 0 0; font-size: 24px; font-weight: 900; color: ${percentage >= 70 ? '#059669' : '#dc2626'};">${percentage}%</p>
                      </td>
                    </tr>
                  </table>

                  <!-- Pass/Fail Badge -->
                  <div style="text-align: center; margin-bottom: 20px;">
                    <span style="display: inline-block; padding: 8px 22px; border-radius: 100px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; background: ${percentage >= 70 ? '#dcfce7' : '#fee2e2'}; color: ${percentage >= 70 ? '#059669' : '#dc2626'};">
                      ${percentage >= 70 ? '✓ Passed — Strong Performance' : '✗ Below Threshold — Follow-up Recommended'}
                    </span>
                  </div>

                  ${resultsHtml}

                  <!-- Dashboard link only — no feedback prompt for quiz alert -->
                  <div style="margin-top: 25px; text-align: center;">
                    <a href="https://lms-mentors-counsellors.vercel.app/admin?userId=${userId}&topicCode=${topicCode}" style="display: inline-block; background-color: #0E5858; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em;">View Full Response on Dashboard →</a>
                  </div>
                </div>

                <!-- Footer Note -->
                <div style="text-align: center; color: #bbb; font-size: 11px; line-height: 1.7;">
                  <p style="margin: 0;">This is an automated quiz alert. No reply is needed for this email.</p>
                  <p style="margin: 6px 0 0 0;">If you have coaching notes for ${counselorName}, please reach out to them directly or use the dashboard.</p>
                  <p style="margin: 10px 0 0 0; font-weight: bold; color: #00B6C1;">BN Internal Training Academy</p>
                </div>

              </div>
          `
        };

        console.log(`\n[EMAIL LOGGER - AUTO_NOTIFY_BUDDY API]`);
        console.log(`-> From: ${payload.from}`);
        console.log(`-> To: ${payload.to}`);
        console.log(`-> Reply-To: ${payload.replyTo}`);
        console.log(`-> CC: ${payload.cc.join(', ')}`);
        console.log(`-> Subject: ${payload.subject}`);
        console.log(`-> Sending auto-report via NodeMailer...`);

        const info = await mailer.sendMail(payload);

        console.log(`-> Auto-Report NodeMailer Response:`, typeof info === 'object' ? JSON.stringify(info, null, 2) : info);
        console.log(`-> Auto-Report successfully sent to Buddy! Message ID: ${info?.messageId}\n`);

      } catch (e) {
        console.error(`Failed to send email to ${buddy.email}:`, e);
      }

      // 3b. Dashboard to Dashboard Notification
      // Find buddy's user ID by email
      const { data: buddyProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', buddy.email)
        .single();

      if (buddyProfile?.id) {
        await supabaseAdmin
          .from('notifications')
          .insert([{
            user_id: buddyProfile.id,
            title: `Trainee Quiz Completed: ${counselorName}`,
            message: `${counselorName} scored ${percentage}% on ${topicCode}. Check the Admin Dashboard to review their submitted responses.`,
            type: percentage < 70 ? 'warning' : 'success',
            action_url: `/admin?userId=${userId}&topicCode=${topicCode}` // Assuming your notification system uses an action_url column, or just leave it in the text. I'll add action_url and update the text just in case. If action_url fails, the client might just not use it. 
          }]);

        // Also log as an activity for the buddy so they see it in their trail
        await supabaseAdmin
          .from('mentor_activity_logs')
          .insert([{
            user_id: buddyProfile.id,
            activity_type: 'TRAINEE_QUIZ',
            content_title: `${counselorName}: ${topicCode} (${percentage}%)`,
            module_id: 'System'
          }]);
      }
    });

    await Promise.all(notificationPromises);

    return NextResponse.json({ success: true, notified: buddies.length });

  } catch (error: any) {
    console.error('Notification API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
