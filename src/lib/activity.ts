import { supabase } from "./supabase";

export type ActivityType =
    | 'view_topic'
    | 'view_content'
    | 'start_quiz'
    | 'complete_quiz'
    | 'submit_assignment'
    | 'start_assignment'
    | 'complete_segment'
    | 'complete_module'
    | 'view_module'
    | 'click_link'
    | 'watch_video'
    | 'start_simulation'
    | 'click_audit'
    | 'view_case_study';

export async function logActivity(activityType: ActivityType, details: {
    moduleId?: string;
    topicCode?: string;
    contentTitle?: string;
    score?: number;
    metadata?: any;
}) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const payload: any = {
            user_id: session.user.id,
            activity_type: activityType,
            module_id: details.moduleId,
            topic_code: details.topicCode,
            content_title: details.contentTitle,
        };

        const { error } = await supabase
            .from('mentor_activity_logs')
            .insert([payload]);

        if (error) {
            console.warn(`Activity logging failed for ${activityType}:`, error.message);
        }
    } catch (err) {
        console.error("Activity logging error:", err);
    }
}
