import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { syllabusData } from '@/data/syllabus';

export async function GET(request: Request) {
    try {
        // Calculate "Today" in IST (UTC+5:30)
        const now = new Date();
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istNow = new Date(now.getTime() + istOffset);

        const todayStart = new Date(istNow);
        todayStart.setUTCHours(0, 0, 0, 0);
        const utcStart = new Date(todayStart.getTime() - istOffset).toISOString();

        // 1. Fetch Global Data for Accurate Stats
        const [
            { data: profiles },
            { data: allProgress },
            { data: allAssessments },
            { data: logs },
            { data: dynContent }
        ] = await Promise.all([
            supabaseAdmin.from('profiles').select('*').in('role', ['counsellor', 'mentor']),
            supabaseAdmin.from('mentor_progress').select('*'),
            supabaseAdmin.from('assessment_logs').select('*'),
            supabaseAdmin.from('mentor_activity_logs').select('*').gte('created_at', utcStart),
            supabaseAdmin.from('syllabus_content').select('id, module_id')
        ]);

        const totalStaticTopics = syllabusData
            .filter(m => m.id !== 'resource-bank')
            .reduce((acc, m) => acc + m.topics.length, 0);
        const totalTopics = totalStaticTopics + (dynContent?.length || 0);

        // 2. Generate Report Object
        const report = (profiles || []).map(p => {
            const userGlobalProgress = (allProgress || []).filter(pr => pr.user_id === p.id);
            const userGlobalAssessments = (allAssessments || []).filter(a => a.user_id === p.id);

            const todayProgress = userGlobalProgress.filter(pr => pr.created_at >= utcStart);
            const todayAssessments = userGlobalAssessments.filter(a => a.created_at >= utcStart);
            const userLogs = (logs || []).filter(l => l.user_id === p.id);

            // Calculate Longest Time Spent Today (from raw_data.time_spent)
            let maxTimeSpent = 0;
            let longestTopicCode = "";
            todayAssessments.forEach(a => {
                const time = a.raw_data?.time_spent || 0;
                if (time > maxTimeSpent) {
                    maxTimeSpent = time;
                    longestTopicCode = a.topic_code;
                }
            });

            // Resolve Longest Topic Title
            let longestTopicTitle = "N/A";
            if (longestTopicCode) {
                if (longestTopicCode.startsWith('MODULE_')) {
                    const modId = longestTopicCode.replace('MODULE_', '');
                    const mod = syllabusData.find(m => m.id === modId);
                    longestTopicTitle = mod ? `${mod.title.split(':')[0]} (Final)` : "Final Quiz";
                } else {
                    for (const mod of syllabusData) {
                        const topic = mod.topics.find(t => t.code === longestTopicCode);
                        if (topic) {
                            longestTopicTitle = `${mod.title.split(':')[0]}: ${topic.title}`;
                            break;
                        }
                    }
                }
            }

            // Convert to minutes/seconds format
            const longestTimeStr = maxTimeSpent > 0
                ? `${Math.floor(maxTimeSpent / 60)}m ${maxTimeSpent % 60}s`
                : "0s";

            // Calculate Modules Completed Today
            let modulesCompletedToday = 0;
            syllabusData.filter(m => m.id !== 'resource-bank').forEach(module => {
                const moduleTopics = module.topics.map(t => t.code);
                const moduleDynTopics = (dynContent || [])
                    .filter(d => d.module_id === module.id)
                    .map(d => `DYN-${d.id}`);

                const allModuleCodes = [...moduleTopics, ...moduleDynTopics];
                const userCompletedCodes = new Set(userGlobalProgress.map(pr => pr.topic_code));

                const allDone = allModuleCodes.every(code => userCompletedCodes.has(code));
                const quizPassed = userGlobalAssessments.some(a => a.topic_code === `MODULE_${module.id}`);

                if (allDone && quizPassed) {
                    const lastTopicCreated = userGlobalProgress
                        .filter(pr => allModuleCodes.includes(pr.topic_code))
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at;

                    const quizCreated = userGlobalAssessments
                        .find(a => a.topic_code === `MODULE_${module.id}`)?.created_at;

                    const completionDate = [lastTopicCreated, quizCreated]
                        .filter(Boolean)
                        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

                    if (completionDate && completionDate >= utcStart) {
                        modulesCompletedToday++;
                    }
                }
            });

            // Global Progress Percentage
            const uniqueCompletedTopics = new Set(userGlobalProgress.map(pr => pr.topic_code)).size;
            const globalProgressPercent = totalTopics > 0
                ? Math.round((uniqueCompletedTopics / totalTopics) * 100)
                : 0;

            return {
                name: p.full_name,
                email: p.email,
                testsTaken: todayAssessments.length,
                modulesCompletedToday,
                longestTime: longestTimeStr,
                longestTopic: longestTopicTitle,
                globalProgress: globalProgressPercent,
                avgScore: todayAssessments.length > 0
                    ? Math.round(todayAssessments.reduce((acc, curr) => acc + curr.score, 0) / todayAssessments.length)
                    : 0,
                activities: userLogs.length
            };
        });

        return NextResponse.json({
            date: todayStart.toDateString(),
            recipient: 'workwithus@balancenutrition.in',
            report
        });

    } catch (err: any) {
        console.error("Report Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
