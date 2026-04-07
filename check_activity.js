const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAnyActivity() {
    const { data: activity } = await supabase.from('mentor_activity_logs').select('*').limit(10);
    console.log("Activity Samples:", activity?.length);
    activity?.forEach(a => console.log(a.user_id, a.activity_type, a.created_at));
}

checkAnyActivity();
