// Manual localStorage cleanup script
// Run this in browser console to clear stale organization data:
// fetch('/clear-org-data.js').then(r => r.text()).then(eval)
 
console.log('🧹 Clearing organization localStorage data...');
localStorage.removeItem('currentOrganizationId');
localStorage.removeItem('currentOrganizationName');
console.log('✅ Cleared organization data. Reloading page...');
window.location.reload(); 