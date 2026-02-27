// @ts-nocheck
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const usersToFix = [
    { email: 'workwithus@balancenutrition.in', password: 'BNADMIN' },
    { email: 'priya.k@balancenutrition.in', password: 'shivani-22' },
    { email: 'vikram.j@balancenutrition.in', password: 'VIK-Joshi-89' },
    { email: 'nida.chadhary@balancenutrition.in', password: 'NidaBN@2026' },
    { email: 'nida.chaudhary@balancenutrition.in', password: 'NidaBN@2026' } // Checking both spellings
];

async function fixPasswords() {
    console.log('🛠 Starting Master Password Recovery...');

    for (const user of usersToFix) {
        console.log(`Checking ${user.email}...`);
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', user.email)
            .single();

        if (profile) {
            const { error } = await supabase
                .from('profiles')
                .update({ temp_password: user.password })
                .eq('id', profile.id);

            if (error) console.error(`   ❌ Failed to update ${user.email}:`, error.message);
            else console.log(`   ✅ Updated password for ${user.email}`);
        } else {
            console.log(`   ⚠️ No profile found for ${user.email}`);
        }
    }
    console.log('✅ Recovery Complete.');
}

fixPasswords();
