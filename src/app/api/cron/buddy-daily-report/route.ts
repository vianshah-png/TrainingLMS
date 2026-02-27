import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { mailer, SENDER_EMAIL } from '@/lib/mail';
import { syllabusData } from '@/data/syllabus';

export async function GET(request: Request) {
  // Security: Check for CRON_SECRET to prevent unauthorized execution
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Calculate "Today" in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const todayStart = new Date(istNow);
    todayStart.setUTCHours(0, 0, 0, 0);
    const utcStart = new Date(todayStart.getTime() - istOffset).toISOString();

    // 2. Fetch Data
    const [
      { data: profiles },
      { data: todayProgress },
      { data: todayAssessments },
      { data: dynContent }
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').in('role', ['counsellor', 'mentor']),
      supabaseAdmin.from('mentor_progress').select('*').gte('created_at', utcStart),
      supabaseAdmin.from('assessment_logs').select('*').gte('created_at', utcStart),
      supabaseAdmin.from('syllabus_content').select('id, module_id')
    ]);

    if (!profiles) return NextResponse.json({ message: 'No profiles found' });

    const totalStaticTopics = syllabusData
      .filter(m => m.id !== 'resource-bank')
      .reduce((acc, m) => acc + m.topics.length, 0);
    const totalTopics = totalStaticTopics + (dynContent?.length || 0);

    const emailPromises: any[] = [];

    // 3. Process each counselor
    for (const counselor of profiles) {
      const counselorProgress = (todayProgress || []).filter(p => p.user_id === counselor.id);
      const counselorAssessments = (todayAssessments || []).filter(a => a.user_id === counselor.id);

      if (counselorProgress.length === 0 && counselorAssessments.length === 0) continue;

      let buddies = [];
      try {
        buddies = typeof counselor.training_buddy === 'string'
          ? JSON.parse(counselor.training_buddy)
          : counselor.training_buddy;
      } catch (e) { continue; }

      if (!Array.isArray(buddies) || buddies.length === 0) continue;

      // Calculate counselor's stats for today
      const avgScore = counselorAssessments.length > 0
        ? Math.round(counselorAssessments.reduce((acc, curr) => acc + curr.score, 0) / counselorAssessments.length)
        : 0;

      // 4. Send email to buddies
      buddies.forEach((buddy: any) => {
        if (!buddy.email) return;

        emailPromises.push(
          mailer.sendMail({
            from: `BN Academy Reports <${SENDER_EMAIL}>`,
            to: buddy.email,
            subject: `Daily Progress Report: ${counselor.full_name}`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; color: #0E5858;">
                <h2 style="color: #00B6C1;">Daily Training Summary</h2>
                <p>Hello <strong>${buddy.name || 'Buddy'}</strong>,</p>
                <p>Here is the training activity for <strong>${counselor.full_name}</strong> for ${todayStart.toDateString()}:</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0;">
                  <div style="background-color: #FAFCEE; padding: 15px; border-radius: 12px; border: 1px solid #00B6C110;">
                    <p style="margin: 0; font-size: 11px; color: #0E585860; text-transform: uppercase; font-weight: 900;">Topics Completed</p>
                    <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">${counselorProgress.length}</p>
                  </div>
                  <div style="background-color: #FAFCEE; padding: 15px; border-radius: 12px; border: 1px solid #00B6C110;">
                    <p style="margin: 0; font-size: 11px; color: #0E585860; text-transform: uppercase; font-weight: 900;">Avg. Test Score</p>
                    <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: ${avgScore >= 70 ? '#10b981' : '#f59e0b'};">${avgScore}%</p>
                  </div>
                </div>

                <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #0E585840; margin-bottom: 15px;">Today's Milestones</h3>
                <ul style="list-style: none; padding: 0;">
                  ${counselorProgress.map(p => `
                    <li style="padding: 10px 0; border-bottom: 1px solid #0E585805; font-size: 13px;">
                      ✅ ${p.topic_code}
                    </li>
                  `).join('')}
                  ${counselorAssessments.map(a => `
                    <li style="padding: 10px 0; border-bottom: 1px solid #0E585805; font-size: 13px;">
                      🧠 Assessed: ${a.topic_code} (${Math.round((a.score / (a.total_questions || 5)) * 100)}%)
                    </li>
                  `).join('')}
                </ul>

                <hr style="border: 0; border-top: 1px solid #0E585810; margin: 30px 0;" />
                <p style="font-size: 11px; color: #999; text-align: center;">Visit the Admin Portal for detailed logs.</p>
              </div>
            `
          })
        );
      });
    }

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      processed: profiles.length,
      emailsSent: emailPromises.length
    });

  } catch (err: any) {
    console.error("Daily Buddy Cron Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
