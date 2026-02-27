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

    const dateLabel = istNow.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

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

    // Build a module -> topics mapping for label lookup
    const moduleMap: Record<string, string> = {};
    syllabusData.forEach(m => { moduleMap[m.id] = m.title; });

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

      // --- Stats Calculation ---
      // Segments completed today (individual topic_codes)
      const segmentsCompleted = counselorProgress.length;

      // Modules completed = distinct module_ids that are fully done
      // We approximate by finding distinct module_ids in progress records
      const modulesWorkedOn = [...new Set(counselorProgress.map(p => p.module_id).filter(Boolean))];

      // Quizzes given today and their scores
      const quizzesTaken = counselorAssessments.length;
      const avgScore = quizzesTaken > 0
        ? Math.round(counselorAssessments.reduce((acc, curr) => acc + (curr.score || 0), 0) / quizzesTaken)
        : null;

      // Overall progress %
      const allTimeProgress = await supabaseAdmin
        .from('mentor_progress').select('topic_code', { count: 'exact' })
        .eq('user_id', counselor.id);
      const overallPercent = Math.min(100, Math.round(((allTimeProgress.count || 0) / totalTopics) * 100));

      // Per-quiz rows
      const quizRows = counselorAssessments.map((a: any) => {
        const pct = Math.round(((a.score || 0) / (a.total_questions || 5)) * 100);
        const color = pct >= 70 ? '#059669' : '#dc2626';
        return `
          <tr>
            <td style="padding: 10px 12px; font-size: 13px; color: #0E5858; border-bottom: 1px solid #f0f0f0;">${a.topic_code}</td>
            <td style="padding: 10px 12px; font-size: 13px; text-align: center; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: ${color};">${a.score ?? '—'} / ${a.total_questions ?? 5}</td>
            <td style="padding: 10px 12px; font-size: 13px; text-align: center; border-bottom: 1px solid #f0f0f0; font-weight: 900; color: ${color};">${pct}%</td>
          </tr>
        `;
      }).join('');

      // Per-segment rows
      const segmentRows = counselorProgress.map((p: any) => `
        <tr>
          <td style="padding: 8px 12px; font-size: 13px; color: #0E5858; border-bottom: 1px solid #f5f5f5;">
            <span style="color: #059669; margin-right: 6px;">✓</span>${p.topic_code}
          </td>
          <td style="padding: 8px 12px; font-size: 11px; color: #999; border-bottom: 1px solid #f5f5f5;">${p.module_id ? (moduleMap[p.module_id] || p.module_id) : '—'}</td>
        </tr>
      `).join('');

      // Score badge for subject line
      const scoreBadge = avgScore !== null ? ` | Avg Score: ${avgScore}%` : '';
      const scoreNote = avgScore !== null
        ? (avgScore >= 70
          ? `<p style="color: #059669; font-weight: bold; margin: 0 0 4px 0;">🟢 Above passing threshold (70%)</p>`
          : `<p style="color: #dc2626; font-weight: bold; margin: 0 0 4px 0;">🔴 Below passing threshold — coaching recommended</p>`)
        : '';

      // --- Email to each buddy ---
      buddies.forEach((buddy: any) => {
        if (!buddy.email) return;

        emailPromises.push(
          mailer.sendMail({
            from: `BN Academy Reports <${SENDER_EMAIL}>`,
            to: buddy.email,
            cc: ['workwithus@balancenutrition.in'],
            replyTo: SENDER_EMAIL,
            subject: `BN Academy | Daily Report: ${counselor.full_name}${scoreBadge} — ${dateLabel}`,
            html: `
              <div style="font-family: Georgia, serif; padding: 40px; color: #0E5858; max-width: 640px; margin: auto; background-color: #FAFCEE;">

                <!-- Header -->
                <div style="border-bottom: 3px solid #00B6C1; padding-bottom: 20px; margin-bottom: 30px;">
                  <p style="margin: 0 0 6px 0; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3em; color: #00B6C1;">BN ACADEMY · END-OF-DAY REPORT</p>
                  <h1 style="margin: 0; font-size: 30px; font-weight: normal; color: #0E5858;">${counselor.full_name}</h1>
                  <p style="margin: 8px 0 0 0; font-size: 13px; color: #888;">${dateLabel}</p>
                </div>

                <!-- Summary Stats Row -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                  <tr>
                    <td width="33%" style="text-align: center; background: white; padding: 18px 10px; border-radius: 16px; border: 1px solid rgba(14,88,88,0.08);">
                      <p style="margin: 0; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em; color: #aaa;">Segments Covered</p>
                      <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: bold; color: #0E5858;">${segmentsCompleted}</p>
                    </td>
                    <td width="4%"></td>
                    <td width="30%" style="text-align: center; background: white; padding: 18px 10px; border-radius: 16px; border: 1px solid rgba(14,88,88,0.08);">
                      <p style="margin: 0; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em; color: #aaa;">Modules Active</p>
                      <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: bold; color: #0E5858;">${modulesWorkedOn.length}</p>
                    </td>
                    <td width="4%"></td>
                    <td width="29%" style="text-align: center; background: white; padding: 18px 10px; border-radius: 16px; border: 1px solid rgba(14,88,88,0.08);">
                      <p style="margin: 0; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.12em; color: #aaa;">Quizzes Taken</p>
                      <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: bold; color: #0E5858;">${quizzesTaken}</p>
                    </td>
                  </tr>
                </table>

                <!-- Overall Progress -->
                <div style="background: white; padding: 20px 25px; border-radius: 16px; border: 1px solid rgba(14,88,88,0.08); margin-bottom: 25px;">
                  <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #00B6C1;">Overall Curriculum Progress</p>
                  <div style="background: #f0f0f0; border-radius: 100px; height: 8px; overflow: hidden;">
                    <div style="height: 8px; width: ${overallPercent}%; background: linear-gradient(to right, #0E5858, #00B6C1); border-radius: 100px;"></div>
                  </div>
                  <p style="margin: 8px 0 0 0; font-size: 13px; font-weight: bold; color: #0E5858;">${overallPercent}% of total curriculum completed</p>
                </div>

                ${quizzesTaken > 0 ? `
                <!-- Quiz Performance -->
                <div style="background: white; padding: 25px; border-radius: 16px; border: 1px solid rgba(14,88,88,0.08); margin-bottom: 25px;">
                  <p style="margin: 0 0 6px 0; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #00B6C1;">Quiz Performance — Today</p>
                  ${scoreNote}
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 15px; border-collapse: collapse;">
                    <thead>
                      <tr style="background: #FAFCEE;">
                        <th style="padding: 8px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; text-align: left; border-bottom: 2px solid #f0f0f0;">Quiz Topic</th>
                        <th style="padding: 8px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; text-align: center; border-bottom: 2px solid #f0f0f0;">Score</th>
                        <th style="padding: 8px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; text-align: center; border-bottom: 2px solid #f0f0f0;">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${quizRows}
                    </tbody>
                  </table>
                  ${avgScore !== null ? `<p style="margin: 16px 0 0 0; font-size: 13px; color: #555; text-align: right;">Average Score: <strong style="color: ${avgScore >= 70 ? '#059669' : '#dc2626'};">${avgScore}%</strong></p>` : ''}
                </div>
                ` : ''}

                ${segmentsCompleted > 0 ? `
                <!-- Segments Covered -->
                <div style="background: white; padding: 25px; border-radius: 16px; border: 1px solid rgba(14,88,88,0.08); margin-bottom: 25px;">
                  <p style="margin: 0 0 15px 0; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #00B6C1;">Segments Covered — Today</p>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                    <thead>
                      <tr style="background: #FAFCEE;">
                        <th style="padding: 8px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; text-align: left; border-bottom: 2px solid #f0f0f0;">Segment Code</th>
                        <th style="padding: 8px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; text-align: left; border-bottom: 2px solid #f0f0f0;">Module</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${segmentRows}
                    </tbody>
                  </table>
                </div>
                ` : ''}

                <!-- Mentor Action Strip -->
                <div style="background: #0E5858; border-radius: 16px; padding: 22px 28px; margin-bottom: 25px;">
                  <p style="margin: 0 0 6px 0; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; color: #00B6C1;">Your Action as Trainer Buddy</p>
                  <p style="margin: 0; font-size: 14px; color: #fff; line-height: 1.7;">
                    Review this report and reply to this email if you have feedback for <strong>${counselor.full_name}</strong>.
                    ${avgScore !== null && avgScore < 70 ? '<br/><strong style="color: #fbbf24;">⚠ Score below 70% — consider scheduling a 1-on-1 coaching session.</strong>' : ''}
                  </p>
                  <div style="margin-top: 16px;">
                    <a href="https://lms-mentors-counsellors.vercel.app/admin?userId=${counselor.id}" style="display: inline-block; background: #00B6C1; color: white; padding: 12px 26px; border-radius: 10px; text-decoration: none; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em;">View Full Dashboard →</a>
                  </div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; color: #bbb; font-size: 11px;">
                  <p style="margin: 0;">Automated end-of-day report · Balance Nutrition Internal Training Academy</p>
                  <p style="margin: 6px 0 0 0; font-weight: bold; color: #00B6C1;">workwithus@balancenutrition.in</p>
                </div>

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
