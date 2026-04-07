const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkShivani() {
    const email = 'priya.k@balancenutrition.in';
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();
    if (!profile) {
        console.log("No profile found for", email);
        return;
    }
    console.log("Profile:", profile);

    const { data: progress } = await supabase.from('mentor_progress').select('*').eq('user_id', profile.id);
    console.log("Progress Count:", progress?.length);

    const { data: assessments } = await supabase.from('assessment_logs').select('*').eq('user_id', profile.id);
    console.log("Assessments Count:", assessments?.length);

    const { data: activity } = await supabase.from('mentor_activity_logs').select('*').eq('user_id', profile.id);
    console.log("Activity Count:", activity?.length);
}

checkShivani();
