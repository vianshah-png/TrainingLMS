const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkModuleIds() {
    const { data: progress } = await supabase.from('mentor_progress').select('module_id, topic_code');
    const validModules = ['module-1', 'module-2', 'module-3', 'module-4', 'module-5', 'module-6']; // Add others if needed

    progress.forEach(p => {
        if (!p.module_id || !p.module_id.startsWith('module-')) {
            console.log("Invalid module_id found:", p.module_id, "for topic:", p.topic_code);
        }
    });
}

checkModuleIds();
