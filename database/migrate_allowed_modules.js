/**
 * Migration: Add allowed_modules column to profiles table
 * 
 * Run this once against your Supabase instance:
 *   node database/migrate_allowed_modules.js
 * 
 * Prerequisites: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
    console.log('🔄 Starting migration: allowed_modules column...');

    // Step 1: Add column (idempotent — Supabase SQL via rpc or direct)
    // We can't run raw DDL via the JS client easily, so we'll do it via
    // the Supabase SQL Editor. This script handles the data backfill.

    console.log('');
    console.log('⚠️  MANUAL STEP REQUIRED:');
    console.log('   Run this SQL in your Supabase SQL Editor first:');
    console.log('');
    console.log('   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allowed_modules JSONB DEFAULT \'[]\'::jsonb;');
    console.log('');

    // Step 2: Backfill — grant all selective modules to existing counsellor accounts
    const { data: counsellors, error: fetchErr } = await supabase
        .from('profiles')
        .select('id, email, role, allowed_modules')
        .eq('role', 'counsellor');

    if (fetchErr) {
        console.error('❌ Failed to fetch counsellors:', fetchErr.message);
        process.exit(1);
    }

    console.log(`📋 Found ${counsellors.length} counsellor accounts to backfill.`);

    const allSelective = ["module-3", "module-4", "module-5"];

    let updated = 0;
    for (const profile of counsellors) {
        // Only backfill if not already set
        const current = profile.allowed_modules || [];
        if (current.length === 0) {
            const { error } = await supabase
                .from('profiles')
                .update({ allowed_modules: allSelective })
                .eq('id', profile.id);

            if (error) {
                console.error(`  ❌ Failed for ${profile.email}: ${error.message}`);
            } else {
                console.log(`  ✅ ${profile.email} → granted M3, M4, M5`);
                updated++;
            }
        } else {
            console.log(`  ⏭️  ${profile.email} — already has modules: ${JSON.stringify(current)}`);
        }
    }

    console.log('');
    console.log(`✅ Migration complete. ${updated}/${counsellors.length} counsellors updated.`);
}

migrate().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
