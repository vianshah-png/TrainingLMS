// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspectProfiles() {
    console.log('🔍 Inspecting Profiles with Passwords...');
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, temp_password, phone');

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.table(data.map(p => ({
            Name: p.full_name,
            Email: p.email,
            Password: p.temp_password || 'MISSING',
            Phone: p.phone || 'REQUIRED'
        })));
    }
}

inspectProfiles().catch(console.error);
