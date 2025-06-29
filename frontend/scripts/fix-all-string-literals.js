#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing All String Literal Issues');
console.log('====================================\n');

let fixesApplied = 0;

const fixStringLiterals = (filePath) => {
  if (!fs.existsSync(filePath)) return false;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix all remaining string literal patterns
  const patterns = [
    // Asset placeholders
    { from: /"placeholder-avatar"/g, to: 'process.env.NEXT_PUBLIC_PLACEHOLDER_AVATAR' },
    { from: /"default-user-avatar"/g, to: 'process.env.NEXT_PUBLIC_DEFAULT_USER_AVATAR' },
    { from: /"default-business-logo"/g, to: 'process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_LOGO' },
    { from: /"default-org-logo"/g, to: 'process.env.NEXT_PUBLIC_DEFAULT_ORG_LOGO' },
    { from: /"logo-light"/g, to: 'process.env.NEXT_PUBLIC_LOGO_LIGHT' },
    { from: /"logo-dark"/g, to: 'process.env.NEXT_PUBLIC_LOGO_DARK' },
    { from: /"favicon"/g, to: 'process.env.NEXT_PUBLIC_FAVICON' },
    { from: /"app-icon"/g, to: 'process.env.NEXT_PUBLIC_APP_ICON' },
    
    // API and URL patterns
    { from: /"api-base-url"/g, to: 'process.env.NEXT_PUBLIC_API_BASE_URL' },
    { from: /"websocket-url"/g, to: 'process.env.NEXT_PUBLIC_WEBSOCKET_URL' },
    { from: /"uploads-url"/g, to: 'process.env.NEXT_PUBLIC_UPLOADS_URL' },
    { from: /"cdn-url"/g, to: 'process.env.NEXT_PUBLIC_CDN_URL' },
    
    // Feature flags
    { from: /"enable-analytics"/g, to: 'process.env.NEXT_PUBLIC_ENABLE_ANALYTICS' },
    { from: /"enable-sentry"/g, to: 'process.env.NEXT_PUBLIC_ENABLE_SENTRY' },
    { from: /"enable-hotjar"/g, to: 'process.env.NEXT_PUBLIC_ENABLE_HOTJAR' },
    
    // Service keys (these should be server-side only)
    { from: /"stripe-publishable-key"/g, to: 'process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY' },
    { from: /"google-analytics-id"/g, to: 'process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID' },
    { from: /"sentry-dsn"/g, to: 'process.env.NEXT_PUBLIC_SENTRY_DSN' },
    
    // Environment and config
    { from: /"app-version"/g, to: 'process.env.NEXT_PUBLIC_APP_VERSION' },
    { from: /"build-id"/g, to: 'process.env.NEXT_PUBLIC_BUILD_ID' },
    { from: /"deployment-url"/g, to: 'process.env.NEXT_PUBLIC_DEPLOYMENT_URL' },
  ];
  
  patterns.forEach(pattern => {
    if (pattern.from.test(content)) {
      content = content.replace(pattern.from, pattern.to);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed string literals in ${path.basename(filePath)}`);
    return true;
  }
  
  return false;
};

// Scan all TypeScript files
const scanAndFix = (dir) => {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  files.forEach(file => {
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      scanAndFix(path.join(dir, file.name));
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      const filePath = path.join(dir, file.name);
      if (fixStringLiterals(filePath)) fixesApplied++;
    }
  });
};

console.log('🔍 Scanning for string literal issues...\n');
scanAndFix('src');

console.log(`\n🎉 Fixed ${fixesApplied} files with string literal issues!`);
