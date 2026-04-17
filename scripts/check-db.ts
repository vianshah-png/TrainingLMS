
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) {
            console.error('Error fetching profiles:', error);
        } else {
            console.log(`Found ${data?.length || 0} profiles.`);
            if (data && data.length > 0) {
                console.table(data.map(p => ({ id: p.id, email: p.email, role: p.role, name: p.full_name })));
            } else {
                console.log('The profiles table is empty.');
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

check();
