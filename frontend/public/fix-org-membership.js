// Fix organization membership script
// Run this in browser console to fix the organization membership issue

console.log("🔧 Fixing organization membership...");

async function fixOrganizationMembership() {
  try {
    // Get current session
    const { data: { session } } = await window.supabase.auth.getSession();
    
    if (!session) {
      console.error("❌ No active session found. Please log in first.");
      return;
    }
    
    const userId = session.user.id;
    console.log(`👤 Current user: ${userId}`);
    
    // 1. Check current organization memberships
    const { data: memberships, error: membershipError } = await window.supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', userId);
    
    if (membershipError) {
      console.error("❌ Error checking memberships:", membershipError);
      return;
    }
    
    console.log(`📋 Current memberships: ${memberships.length}`);
    memberships.forEach(m => {
      console.log(`  - Org: ${m.organization_id}, Role: ${m.role}`);
    });
    
    // 2. Check owned organizations
    const { data: ownedOrgs, error: ownedError } = await window.supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', userId);
    
    if (ownedError) {
      console.error("❌ Error checking owned orgs:", ownedError);
      return;
    }
    
    console.log(`🏢 Owned organizations: ${ownedOrgs.length}`);
    ownedOrgs.forEach(org => {
      console.log(`  - ${org.name} (${org.organization_id})`);
    });
    
    // 3. Find organizations the user owns but isn't a member of
    const membershipOrgIds = new Set(memberships.map(m => m.organization_id));
    const missingMemberships = ownedOrgs.filter(org => 
      !membershipOrgIds.has(org.organization_id)
    );
    
    if (missingMemberships.length === 0) {
      console.log("✅ All organization memberships are correct!");
      
      // Clear localStorage to force refresh
      localStorage.removeItem('organization-store');
      console.log("🧹 Cleared organization store cache");
      
      // Refresh the page
      console.log("🔄 Refreshing page...");
      window.location.reload();
      return;
    }
    
    console.log(`🔧 Found ${missingMemberships.length} missing memberships, fixing...`);
    
    // 4. Add missing memberships
    for (const org of missingMemberships) {
      console.log(`📝 Adding membership for org: ${org.name} (${org.organization_id})`);
      
      const { error: insertError } = await window.supabase
        .from('organization_members')
        .insert({
          user_id: userId,
          organization_id: org.organization_id,
          role: 'owner'
        });
      
      if (insertError) {
        console.error(`❌ Error adding membership for ${org.name}:`, insertError);
      } else {
        console.log(`✅ Added membership for ${org.name}`);
      }
    }
    
    // 5. Clear caches and refresh
    localStorage.removeItem('organization-store');
    console.log("🧹 Cleared organization store cache");
    
    console.log("✅ Organization membership fix complete!");
    console.log("🔄 Refreshing page in 2 seconds...");
    
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error("❌ Error fixing organization membership:", error);
  }
}

// Initialize supabase client if not already available
if (!window.supabase) {
  console.log("📡 Initializing Supabase client...");
  const { createClient } = window.supabase_js || require('@supabase/supabase-js');
  window.supabase = createClient(
    "http://localhost:54321",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
  );
}

// Run the fix
fixOrganizationMembership(); 