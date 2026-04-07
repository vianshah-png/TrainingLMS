const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkShivaniAudits() {
    const email = 'priya.k@balancenutrition.in';
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();
    if (!profile) return;

    const { data: audits } = await supabase.from('summary_audits').select('*').eq('user_id', profile.id);
    console.log("Shivani Audits:", audits.length);
}

checkShivaniAudits();
