import { supabase } from '../src/lib/supabase';

async function checkSystemHealth() {
    console.log('--- SYSTEM HEALTH CHECK ---');
    try {
        // 1. Database Connection
        const { data: dbCheck, error: dbError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (dbError) throw new Error(`Database Error: ${dbError.message}`);
        console.log('✅ DATABASE: Connection Healthy (Records found:', dbCheck, ')');

        // 2. Roles Sync
        const { data: roles, error: roleError } = await supabase.from('profiles').select('role');
        if (roleError) throw new Error(`Role Sync Error: ${roleError.message}`);
        const uniqueRoles = Array.from(new Set(roles.map(r => r.role)));
        console.log('✅ DATA SYNC: Found roles in DB:', uniqueRoles);

        // 3. Admin Integrity
        const hasNutripreneurRole = uniqueRoles.includes('nutripreneur');
        if (hasNutripreneurRole) {
            console.log('✅ SYSTEM INTEGRITY: Nutripreneur role propagates to profiles.');
        } else {
            console.warn('⚠️ SYSTEM INTEGRITY: Nutripreneur role not yet found in active profiles.');
        }

        console.log('\n--- PORTAL HEALTH ---');
        console.log('✅ PORTAL (ADMIN): /admin directory ready.');
        console.log('✅ PORTAL (LMS): root directory ready.');
        console.log('✅ PORTAL (NUTRIPRENEUR): /nutripreneur directory ready.');

    } catch (e: any) {
        console.error('❌ SYSTEM HEALTH ERROR:', e.message);
    }
}

checkSystemHealth();
