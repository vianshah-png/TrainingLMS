// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkInfrastructure() {
    console.log('🔍 Checking database infrastructure...');

    // Check Profiles for 'phone'
    const { data: profileCols, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (pError) {
        console.log('❌ Profiles Error:', pError.message);
    } else {
        const hasPhone = Object.keys(profileCols[0] || {}).includes('phone');
        console.log(hasPhone ? '✅ Profiles has "phone" column' : '❌ Profiles MISSING "phone" column');
    }

    // Check Notifications table
    const { error: nError } = await supabase
        .from('notifications')
        .select('*')
        .limit(1);

    if (nError) {
        console.log('❌ Notifications Table Error:', nError.message);
    } else {
        console.log('✅ Notifications table exists');
    }
}

checkInfrastructure().catch(console.error);
