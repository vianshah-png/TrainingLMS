const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRefresh() {
    const { data: pData } = await supabase.from('profiles').select('*');
    const { data: prData } = await supabase.from('mentor_progress').select('*');

    const shivani = pData.find(p => p.full_name === 'Shivani' || p.email === 'priya.k@balancenutrition.in');
    if (!shivani) {
        console.log("Shivani NOT FOUND in profiles");
    } else {
        console.log("Shivani in profiles:", shivani.id);
        const up = prData.filter(p => p.user_id === shivani.id);
        console.log("Shivani progress items found:", up.length);
        if (up.length > 0) {
            console.log("Sample progress user_id:", up[0].user_id);
            console.log("Match:", up[0].user_id === shivani.id);
        }
    }
}

debugRefresh();
