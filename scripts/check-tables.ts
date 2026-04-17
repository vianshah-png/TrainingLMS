
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function check() {
    const tables = [
        'profiles',
        'assessment_logs',
        'mentor_activity_logs',
        'summary_audits',
        'syllabus_content',
        'mentor_progress',
        'simulation_logs'
    ];

    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.error(`❌ Table "${table}" error:`, error.message);
        } else {
            console.log(`✅ Table "${table}": ${count} records`);
        }
    }
}

check();
