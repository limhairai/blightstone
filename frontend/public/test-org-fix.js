// Test script to verify organization API fix
// Run this in browser console to test the fix

console.log("🧪 Testing organization API fix...");

async function testOrganizationFix() {
  try {
    // Get current session
    const { data: { session } } = await window.supabase.auth.getSession();
    
    if (!session) {
      console.error("❌ No active session found. Please log in first.");
      return;
    }
    
    console.log(`👤 Testing with user: ${session.user.id}`);
    
    // Test 1: Check auth status
    console.log("\n🔍 Test 1: Authentication Status");
    const authResponse = await fetch('/api/debug/auth-test', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log("✅ Auth test passed");
      console.log(`   User: ${authData.user_email}`);
      console.log(`   Profile org: ${authData.profile?.organization_id || 'None'}`);
      console.log(`   Memberships: ${authData.memberships.length}`);
      console.log(`   Owned orgs: ${authData.owned_organizations.length}`);
      
      // Store for next tests
      window.testData = authData;
    } else {
      console.error("❌ Auth test failed:", await authResponse.text());
      return;
    }
    
    // Test 2: Get all organizations
    console.log("\n🔍 Test 2: Get All Organizations");
    const allOrgsResponse = await fetch('/api/organizations', {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    
    console.log(`Response: ${allOrgsResponse.status}`);
    if (allOrgsResponse.ok) {
      const allOrgsData = await allOrgsResponse.json();
      console.log(`✅ Found ${allOrgsData.organizations?.length || 0} organizations`);
      allOrgsData.organizations?.forEach((org, i) => {
        console.log(`   ${i+1}. ${org.name} (${org.id})`);
      });
      
      // Test 3: Get specific organization (the failing one)
      if (allOrgsData.organizations?.length > 0) {
        const testOrgId = allOrgsData.organizations[0].id;
        console.log(`\n🔍 Test 3: Get Specific Organization (${testOrgId})`);
        
        const specificOrgResponse = await fetch(`/api/organizations?id=${testOrgId}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        
        console.log(`Response: ${specificOrgResponse.status}`);
        if (specificOrgResponse.ok) {
          const specificOrgData = await specificOrgResponse.json();
          console.log(`✅ Successfully fetched specific organization`);
          console.log(`   Org: ${specificOrgData.organizations?.[0]?.name}`);
        } else {
          console.error(`❌ Failed to fetch specific org: ${await specificOrgResponse.text()}`);
        }
      }
    } else {
      console.error(`❌ Failed to get all orgs: ${await allOrgsResponse.text()}`);
    }
    
    // Test 4: Try the fix-membership endpoint
    console.log("\n🔍 Test 4: Fix Membership API");
    const fixResponse = await fetch('/api/debug/fix-membership', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Response: ${fixResponse.status}`);
    if (fixResponse.ok) {
      const fixData = await fixResponse.json();
      console.log(`✅ Fix result: ${fixData.message}`);
      console.log(`   Fixed memberships: ${fixData.details.fixed_memberships}`);
      if (fixData.details.errors?.length > 0) {
        console.log(`   Errors: ${fixData.details.errors.join(', ')}`);
      }
    } else {
      console.error(`❌ Fix failed: ${await fixResponse.text()}`);
    }
    
    console.log("\n🎉 Test complete! Check results above.");
    
  } catch (error) {
    console.error("❌ Test error:", error);
  }
}

// Initialize supabase client if needed
if (!window.supabase) {
  console.log("📡 Initializing Supabase client...");
  const { createClient } = window.supabase_js || require('@supabase/supabase-js');
  window.supabase = createClient(
    "http://localhost:54321",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
  );
}

// Run the test
testOrganizationFix(); 