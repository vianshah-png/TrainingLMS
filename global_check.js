const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function globalCheck() {
    console.log("--- PROFILES ---");
    const { data: profiles } = await supabase.from('profiles').select('*');
    profiles.forEach(p => console.log(`${p.id} | ${p.email} | ${p.full_name}`));

    console.log("\n--- ORPHANED PROGRESS ---");
    const { data: progress } = await supabase.from('mentor_progress').select('*');
    const profileIds = new Set(profiles.map(p => p.id));
    const orphaned = progress.filter(pr => !profileIds.has(pr.user_id));
    console.log("Orphaned progress records count:", orphaned.length);
    if (orphaned.length > 0) {
        orphaned.forEach(o => console.log(`Orphaned: ${o.user_id} | ${o.topic_code}`));
    }

    console.log("\n--- SHIVANI SPECIFIC ---");
    const shivani = profiles.find(p => p.email === 'priya.k@balancenutrition.in');
    if (shivani) {
        const up = progress.filter(pr => pr.user_id === shivani.id);
        console.log(`Shivani (ID: ${shivani.id}) has ${up.length} progress items.`);
    } else {
        console.log("Shivani NOT FOUND in profiles table.");
    }
}

globalCheck();
