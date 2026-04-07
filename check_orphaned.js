const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrphanedLogs() {
    const { data: profiles } = await supabase.from('profiles').select('id');
    const { data: logs } = await supabase.from('mentor_activity_logs').select('*');

    const profileIds = new Set(profiles.map(p => p.id));
    const orphaned = logs.filter(l => !profileIds.has(l.user_id));

    console.log("Orphaned logs found:", orphaned.length);
    if (orphaned.length > 0) {
        // Group by user_id to see if there's a big block for one ID
        const groups = {};
        orphaned.forEach(l => {
            groups[l.user_id] = (groups[l.user_id] || 0) + 1;
        });
        console.log("Orphaned Log Groups:", groups);
    }

    const { data: orphanedProgress } = await supabase.from('mentor_progress').select('*');
    const oProgress = orphanedProgress.filter(p => !profileIds.has(p.user_id));
    console.log("Orphaned progress found:", oProgress.length);
    if (oProgress.length > 0) {
        const pGroups = {};
        oProgress.forEach(p => {
            pGroups[p.user_id] = (pGroups[p.user_id] || 0) + 1;
        });
        console.log("Orphaned Progress Groups:", pGroups);
    }
}

checkOrphanedLogs();
