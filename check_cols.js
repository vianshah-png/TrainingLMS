const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCols() {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'mentor_progress' });
    if (error) {
        // Fallback: try to insert and see what happens or just fetch one row raw
        const { data: raw } = await supabase.from('mentor_progress').select('*').limit(1);
        console.log("Raw row keys:", raw?.[0] ? Object.keys(raw[0]) : "No data");
    } else {
        console.log("Columns:", data);
    }
}

checkCols();
