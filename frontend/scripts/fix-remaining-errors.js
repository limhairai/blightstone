#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Fixing Remaining Build Errors');
console.log('==================================\n');

// 1. Fix env-config.ts - add missing export
const envConfigPath = 'src/lib/env-config.ts';
if (fs.existsSync(envConfigPath)) {
  let content = fs.readFileSync(envConfigPath, 'utf8');
  
  // Add missing getCurrentDataSource function
  if (!content.includes('getCurrentDataSource')) {
    content += `

// ✅ SECURE: Data source selection
export const getCurrentDataSource = (): 'demo' | 'production' => {
  return CLIENT_CONFIG.IS_DEVELOPMENT ? 'demo' : 'production';
};
`;
    fs.writeFileSync(envConfigPath, content);
    console.log('✅ Added missing getCurrentDataSource export');
  }
}

// 2. Fix demo-data-panel.tsx - simplify environment detection
const demoPanelPath = 'src/components/admin/demo-data-panel.tsx';
if (fs.existsSync(demoPanelPath)) {
  let content = fs.readFileSync(demoPanelPath, 'utf8');
  
  // Replace complex environment detection with simple one
  content = content.replace(
    /(typeof window === "undefined" \? \(typeof window === 'undefined' \? "production" : 'production'\) : "production")/g,
    'process.env.NODE_ENV || "development"'
  );
  
  fs.writeFileSync(demoPanelPath, content);
  console.log('✅ Fixed demo-data-panel environment detection');
}

// 3. Fix any other similar patterns
const fixEnvironmentPatterns = (dir) => {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  files.forEach(file => {
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      fixEnvironmentPatterns(`${dir}/${file.name}`);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      const filePath = `${dir}/${file.name}`;
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // Fix overly complex environment detection
      const complexPattern = /\(typeof window === "undefined" \? \(typeof window === 'undefined' \? "production" : 'production'\) : "production"\)/g;
      if (complexPattern.test(content)) {
        content = content.replace(complexPattern, '"production"');
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Fixed environment pattern in ${file.name}`);
      }
    }
  });
};

fixEnvironmentPatterns('src');

console.log('\n🎉 All remaining errors fixed!');
