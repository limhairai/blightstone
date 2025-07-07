// Browser console script to test immediate cache invalidation
// Run this in your browser console to force refresh subscription data

window.testCacheInvalidation = function(organizationId = 'ad54b5b3-6cb0-4ad9-b862-65aea149c6d0') {
  console.log('🔄 Testing cache invalidation for org:', organizationId);
  
  // Trigger cache invalidation event
  const event = new CustomEvent('cache-invalidation', {
    detail: { organizationId, type: 'subscription', timestamp: Date.now() }
  });
  window.dispatchEvent(event);

  // Also trigger via localStorage
  const cacheData = { type: 'subscription', timestamp: Date.now() };
  localStorage.setItem(`cache_invalidate_${organizationId}`, JSON.stringify(cacheData));
  
  console.log('✅ Cache invalidation triggered! Check for subscription data refresh...');
  
  // Clean up after 5 seconds
  setTimeout(() => {
    localStorage.removeItem(`cache_invalidate_${organizationId}`);
    console.log('🧹 Cache invalidation cleanup completed');
  }, 5000);
};

console.log('💡 Cache invalidation test function loaded!');
console.log('💡 Run: testCacheInvalidation() to test immediate cache refresh');
console.log('💡 Or run: testCacheInvalidation("your-org-id") with a specific org ID'); 