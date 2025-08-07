const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xewhfrwuzkfbnpwtdxuf.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdHubTables() {
    console.log('🔍 Checking AdHub Core Tables...\n');
    
    const coreAdHubTables = [
        'business_managers', 'ad_accounts', 'pixels', 
        'topup_requests', 'application', 'asset',
        'businesses', 'bm_applications'
    ];
    
    console.log('🔍 Checking tables for full AdHub demo:');
    
    for (const tableName of coreAdHubTables) {
        try {
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
    
    console.log('\n💡 For full demo we need:');
    console.log('• Business Managers - Show BM acquisition');
    console.log('• Ad Accounts - Show account management');
    console.log('• Pixels - Show pixel creation/management');
    console.log('• Topup Requests - Show funding workflow');
    console.log('• Applications - Show client request flow');
}

checkAdHubTables(); 