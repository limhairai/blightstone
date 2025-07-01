// Quick fix for organization membership
// Copy and paste this into browser console while logged in

(async function quickFix() {
  console.log("🔧 Quick Fix: Organization Membership");
  
  try {
    // Method 1: Try with credentials (should work if logged in)
    console.log("🔍 Attempting fix via cookie authentication...");
    
    let response = await fetch("/api/debug/fix-membership", { 
      method: "POST",
      credentials: 'include',
      headers: { 
        "Content-Type": "application/json"
      } 
    });
    
    // Method 2: If method 1 fails, try to extract token from localStorage
    if (!response.ok && response.status === 401) {
      console.log("🔍 Cookie auth failed, trying token from localStorage...");
      
      // Try to find the auth token in localStorage
      const authKey = Object.keys(localStorage).find(key => 
        key.includes('supabase') && key.includes('auth')
      );
      
      if (authKey) {
        const authData = JSON.parse(localStorage.getItem(authKey) || '{}');
        const token = authData.access_token;
        
        if (token) {
          console.log("🔍 Found token, retrying with Authorization header...");
          response = await fetch("/api/debug/fix-membership", { 
            method: "POST",
            headers: { 
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            } 
          });
        }
      }
    }
    
    const result = await response.json();
    
    if (response.ok) {
      console.log("✅ Fix completed!");
      console.log("📊 Results:", result);
      
      // Clear localStorage
      localStorage.removeItem('organization-store');
      localStorage.removeItem('currentOrganizationId');
      localStorage.removeItem('currentOrganizationName');
      console.log("🧹 Cleared stale cache");
      
      // Refresh page
      console.log("🔄 Refreshing page...");
      setTimeout(() => window.location.reload(), 1000);
      
    } else {
      console.error("❌ Fix failed:", result);
      console.log("💡 Make sure you're logged in and on the dashboard");
      console.log("💡 If this persists, try logging out and back in");
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
    console.log("💡 Make sure you're logged in and try again");
    console.log("💡 You can also try navigating to /dashboard first, then running this script");
  }
})(); 