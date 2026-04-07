import { supabase } from "./supabase";

export interface SocialPost {
    id: number;
    title: string;
    postType: string;
    postSubType: string;
    description?: string;
    tags?: string;
    videoId?: string;
    postLink?: string;
    dur?: string;
}

/**
 * Fetches content posts from the `nutripreneur_content` Supabase table.
 * Returns an empty array gracefully if the table doesn't exist yet.
 */
export async function fetchSocialPosts(): Promise<SocialPost[]> {
    try {
        const { data, error } = await supabase
            .from("nutripreneur_content")
            .select("*")
            .order("id", { ascending: false })
            .limit(50);

        if (error) {
            console.warn("fetchSocialPosts: Supabase error —", error.message);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            title: row.title,
            postType: row.post_type || "video",
            postSubType: row.post_sub_type || "General",
            description: row.description,
            tags: row.tags,
            videoId: row.video_id,
            postLink: row.post_link,
            dur: row.duration,
        }));
    } catch (e) {
        console.error("fetchSocialPosts: Unexpected error —", e);
        return [];
    }
}
