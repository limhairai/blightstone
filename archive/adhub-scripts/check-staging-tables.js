const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xewhfrwuzkfbnpwtdxuf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
    console.log('🔍 Checking Staging Database Tables...\n');
    
    const requiredTables = ['organizations', 'profiles', 'wallets', 'businesses', 'transactions', 'organization_members'];
    
    console.log('🔍 Checking required tables for demo:');
    
    for (const tableName of requiredTables) {
        try {
            // Try to query each table to see if it exists
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
                
            if (error) {
                if (error.message.includes('does not exist')) {
                    console.log(`   ❌ ${tableName} - MISSING!`);
                } else {
                    console.log(`   ⚠️  ${tableName} - Error: ${error.message}`);
                }
            } else {
                console.log(`   ✅ ${tableName} - EXISTS`);
            }
        } catch (error) {
            console.log(`   ❌ ${tableName} - Error: ${error.message}`);
        }
    }
    
    console.log('\n💡 To fix missing tables, you need to:');
    console.log('1. Push latest migrations to staging:');
    console.log('   supabase db push --project-ref xewhfrwuzkfbnpwtdxuf');
    console.log('2. Or run the staging setup script:');
    console.log('   ./scripts/deployment/setup-staging.sh');
}

checkTables(); 