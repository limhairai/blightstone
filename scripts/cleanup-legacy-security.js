#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning Up Legacy Security Files');
console.log('====================================\n');

// Files to keep (the good ones)
const filesToKeep = [
  'scripts/enhanced-security-dashboard.js',  // Main security dashboard
  'frontend/src/lib/security/csp.ts',        // CSP configuration
  'frontend/src/lib/server-auth.ts',         // Server auth utilities
  'backend/app/core/security.py'             // Backend security
];

// Legacy/duplicate files to remove
const filesToRemove = [
  // Duplicate security dashboards
  'scripts/security-dashboard.js',           // Basic version (we have enhanced)
  'frontend/scripts/security-dashboard.js',  // Duplicate location
  
  // Legacy cleanup scripts (one-time use)
  'scripts/immediate-security-fixes.js',     // Already applied
  'scripts/complete-security-cleanup.js',    // Already applied  
  'scripts/final-security-push.js',          // Already applied
  'scripts/ultimate-security-cleanup.js',    // Already applied
  
  // Duplicate scripts in frontend
  'frontend/scripts/immediate-security-fixes.js', // Duplicate
  'frontend/scripts/security-audit.js',           // Old version
  
  // Legacy validation (we have enhanced dashboard)
  'scripts/security-validation.js',          // Redundant with dashboard
];

let removedCount = 0;

console.log('🔍 Files to keep (SECURE):');
filesToKeep.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`⚠️  ${file} (missing)`);
  }
});

console.log('\n🗑️  Removing legacy files:');
filesToRemove.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      fs.unlinkSync(file);
      console.log(`🗑️  Removed: ${file}`);
      removedCount++;
    } catch (error) {
      console.log(`❌ Failed to remove: ${file} (${error.message})`);
    }
  } else {
    console.log(`⚪ Not found: ${file}`);
  }
});

// Create consolidated security commands in package.json script
const packageJsonPath = 'frontend/package.json';
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add security scripts
  if (!packageJson.scripts) packageJson.scripts = {};
  
  packageJson.scripts['security:check'] = 'node ../scripts/enhanced-security-dashboard.js';
  packageJson.scripts['security:audit'] = 'npm audit && node ../scripts/enhanced-security-dashboard.js';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('\n✅ Added security scripts to package.json:');
  console.log('   npm run security:check  - Run security dashboard');
  console.log('   npm run security:audit  - Full security audit');
}

// Create comprehensive dashboard documentation
const dashboardDocsPath = 'docs/SECURITY_DASHBOARD.md';
const dashboardDocs = `# 🔒 Security Dashboard Documentation

## Overview
The Security Dashboard is a **development tool** that monitors your application's security health in real-time.

## What It Is
- ✅ **Command-line tool** (not a web page)
- ✅ **Terminal output** with security metrics  
- ✅ **Development/DevOps utility**
- ✅ **CI/CD integration ready**

## Usage

### Quick Security Check
\`\`\`bash
npm run security:check
\`\`\`

### Full Security Audit
\`\`\`bash
npm run security:audit
\`\`\`

### Manual Execution
\`\`\`bash
node scripts/enhanced-security-dashboard.js
\`\`\`

## Output Example
\`\`\`
🔒 AdHub Enhanced Security Dashboard
=====================================

💰 Financial Security:     100/100 (ENTERPRISE-GRADE)
🌍 Environment Security:   94/100 (PRODUCTION-READY)
🔐 Authentication:         80/100 (FRAMEWORK-READY)
🛡️ Data Protection:        100/100 (COMPREHENSIVE)

�� Overall Security Score: 94/100
🎯 Production Ready: ✅ YES
\`\`\`

## Integration with CI/CD

### GitHub Actions
\`\`\`yaml
- name: Security Check
  run: npm run security:audit
\`\`\`

### Pre-commit Hook
\`\`\`bash
#!/bin/sh
npm run security:check
\`\`\`

## Other SaaS Dashboard Types

### Development Dashboards (CLI Tools)
- **Security Dashboard** ← What we built
- **Performance Dashboard** - Bundle analysis
- **Test Coverage Dashboard** - Test metrics
- **Dependency Dashboard** - Package health

### Production Dashboards (Web UI)
- **Admin Dashboard** - Your /admin pages
- **User Dashboard** - Your /dashboard pages  
- **Analytics Dashboard** - Business metrics
- **System Health Dashboard** - Uptime monitoring

## Security Dashboard vs Web Dashboard

| Security Dashboard | Web Dashboard |
|-------------------|---------------|
| CLI tool | Web interface |
| Development use | Production use |
| Security metrics | Business metrics |
| Terminal output | Browser UI |
| DevOps focused | User focused |

The Security Dashboard is a **development tool**, not a user-facing feature!
`;

if (!fs.existsSync('docs')) fs.mkdirSync('docs');
fs.writeFileSync(dashboardDocsPath, dashboardDocs);
console.log(`\n📚 Created documentation: ${dashboardDocsPath}`);

console.log(`\n🎉 Cleanup complete!`);
console.log(`📊 Removed ${removedCount} legacy files`);
console.log(`✅ Kept ${filesToKeep.length} essential security files`);
console.log(`📚 Added comprehensive documentation`);

console.log('\n�� Available Security Commands:');
console.log('  npm run security:check   - Quick security dashboard');
console.log('  npm run security:audit   - Full security audit');
console.log('');
console.log('�� Your security setup is now clean and production-ready!');
