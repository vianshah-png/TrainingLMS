const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deepSearchShivani() {
    // Look for any record that mentions 'priya.k' or 'Shivani' in ANY log table
    // by checking for IDs that might have belonged to her email in the past (if we can find them in logs)
    const { data: qLogs } = await supabase.from('assessment_logs').select('*');
    const { data: aLogs } = await supabase.from('mentor_activity_logs').select('*');

    // Also check profiles for ANY profile with that name
    const { data: allProfiles } = await supabase.from('profiles').select('*').ilike('full_name', '%Shivani%');
    console.log("Shivani Profiles:", allProfiles);

    const shivaniEmails = ['priya.k@balancenutrition.in'];
    // Find all unique user_ids in logs
    const allUserIds = new Set([
        ...qLogs.map(l => l.user_id),
        ...aLogs.map(l => l.user_id)
    ]);

    console.log("Total unique User IDs in logs:", allUserIds.size);
    // Find User IDs that don't have a profile
    const profileIds = new Set((await supabase.from('profiles').select('id')).data.map(p => p.id));
    const orphanedIds = [...allUserIds].filter(id => !profileIds.has(id));
    console.log("Orphaned IDs:", orphanedIds);

    for (const oid of orphanedIds) {
        const count = qLogs.filter(l => l.user_id === oid).length + aLogs.filter(l => l.user_id === oid).length;
        console.log(`Orphaned ID ${oid} has ${count} log entries.`);
    }
}

deepSearchShivani();
