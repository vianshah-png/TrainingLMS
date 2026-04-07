const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchemas() {
    const tables = ['assessment_logs', 'mentor_activity_logs'];
    for (const table of tables) {
        const { data } = await supabase.from(table).select('*').limit(1);
        console.log(`Table: ${table} | Keys:`, data?.[0] ? Object.keys(data[0]) : "No data");
    }
}

checkSchemas();
