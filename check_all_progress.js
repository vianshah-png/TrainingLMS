const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllProgress() {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email');
    const { data: progress } = await supabase.from('mentor_progress').select('*');

    profiles.forEach(p => {
        const up = progress.filter(pr => pr.user_id === p.id);
        console.log(`${p.full_name} (${p.email}): ${up.length} progress items`);
    });
}

checkAllProgress();
