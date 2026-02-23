import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACTIVE_EMAILS = [
    'workwithus@balancenutrition.in',
    'priya.k@balancenutrition.in',
    'vikram.j@balancenutrition.in'
];

async function cleanupProfiles() {
    console.log('🧹 Cleaning up profiles table to keep only 3 active accounts...');

    // 1. Get all profiles
    const { data: profiles } = await supabase.from('profiles').select('id, email');

    if (!profiles) return;

    for (const profile of profiles) {
        if (!ACTIVE_EMAILS.includes(profile.email)) {
            console.log(`🗑️ Deleting profile: ${profile.email}`);

            // Delete dependent data first (safety)
            await supabase.from('mentor_activity_logs').delete().eq('user_id', profile.id);
            await supabase.from('mentor_progress').delete().eq('user_id', profile.id);
            await supabase.from('assessment_logs').delete().eq('user_id', profile.id);
            await supabase.from('summary_audits').delete().eq('user_id', profile.id);

            // Delete from profiles
            const { error } = await supabase.from('profiles').delete().eq('id', profile.id);
            if (error) console.error(`   ❌ Failed to delete ${profile.email}:`, error.message);
            else console.log(`   ✅ Deleted.`);
        }
    }

    console.log('\n✨ Database now contains only the 3 specified accounts.');
}

cleanupProfiles().catch(console.error);
