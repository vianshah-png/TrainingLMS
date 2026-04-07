const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkSystemHealth() {
    console.log('\n--- SYSTEM HEALTH CHECK ---');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
        const { data: dbCheck, error: dbError } = await supabase.from('profiles').select('id, role', { count: 'exact' });
        if (dbError) throw dbError;
        
        console.log(`✅ DATABASE: Connection Healthy (Total Profiles: ${dbCheck.length})`);
        
        const roles = Array.from(new Set(dbCheck.map(p => p.role)));
        console.log(`✅ ROLE SYNC: Active Roles found in DB: [${roles.join(', ')}]`);

        // Check Portals files
        const fs = require('fs');
        const path = require('path');
        const root = process.cwd();
        
        const portals = [
           { name: 'ADMIN', path: 'src/app/admin' },
           { name: 'LMS-CORE', path: 'src/app/(dashboard)' },
           { name: 'NUTRIPRENEUR', path: 'src/app/nutripreneur' }
        ];

        console.log('\n--- PORTAL INTEGRITY ---');
        portals.forEach(p => {
           if (fs.existsSync(path.join(root, p.path))) {
               console.log(`✅ PORTAL [${p.name}]: Accessible at ${p.path}`);
           } else {
               console.warn(`⚠️ PORTAL [${p.name}]: Directory not found at ${p.path}`);
           }
        });

    } catch (e) {
        console.error(`❌ SYSTEM HEALTH ERROR: ${e.message}`);
    }
}

checkSystemHealth();
