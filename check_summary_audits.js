const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSummaryAudits() {
    const { data: raw } = await supabase.from('summary_audits').select('*').limit(1);
    console.log("Summary Audits Row keys:", raw?.[0] ? Object.keys(raw[0]) : "No data or empty");
}

checkSummaryAudits();
