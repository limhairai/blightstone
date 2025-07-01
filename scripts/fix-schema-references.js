#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define the replacements to make
const replacements = [
  // Field name standardization
  { from: /dolphin_asset_id/g, to: 'dolphin_id', description: 'dolphin_asset_id → dolphin_id' },
  { from: /asset_type/g, to: 'type', description: 'asset_type → type (in asset context)' },
  { from: /asset_metadata/g, to: 'metadata', description: 'asset_metadata → metadata' },
  
  // Table name standardization (only in frontend)
  { from: /dolphin_assets/g, to: 'asset', description: 'dolphin_assets → asset (table name)' },
  
  // Specific field access patterns
  { from: /asset\.dolphin_asset_id/g, to: 'asset.dolphin_id', description: 'asset.dolphin_asset_id → asset.dolphin_id' },
  { from: /asset\.asset_metadata/g, to: 'asset.metadata', description: 'asset.asset_metadata → asset.metadata' },
  { from: /asset\.asset_type/g, to: 'asset.type', description: 'asset.asset_type → asset.type' },
  
  // Metadata access patterns
  { from: /metadata\?\.\s*business_manager_id/g, to: 'metadata?.business_manager_id', description: 'Fix metadata access' },
  { from: /!metadata\?\.\s*business_manager_id/g, to: '!metadata?.business_manager_id', description: 'Fix negated metadata access' },
];

// Files and directories to process (frontend only to avoid breaking backend)
const targetPaths = [
  'frontend/src',
  'frontend/scripts',
];

// Files to exclude
const excludePatterns = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/,
  /\.next/,
];

function shouldProcessFile(filePath) {
  // Only process specific file types
  const validExtensions = ['.ts', '.tsx', '.js', '.jsx'];
  const ext = path.extname(filePath);
  if (!validExtensions.includes(ext)) return false;
  
  // Skip excluded patterns
  for (const pattern of excludePatterns) {
    if (pattern.test(filePath)) return false;
  }
  
  return true;
}

function getAllFiles(dir, filesList = []) {
  if (!fs.existsSync(dir)) return filesList;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllFiles(filePath, filesList);
    } else if (shouldProcessFile(filePath)) {
      filesList.push(filePath);
    }
  });
  
  return filesList;
}

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const changes = [];
    
    for (const replacement of replacements) {
      const originalContent = content;
      content = content.replace(replacement.from, replacement.to);
      
      if (content !== originalContent) {
        modified = true;
        changes.push(replacement.description);
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${filePath}`);
      changes.forEach(change => console.log(`   - ${change}`));
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔄 Starting schema reference standardization...\n');
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  
  for (const targetPath of targetPaths) {
    console.log(`📁 Processing ${targetPath}...`);
    
    const files = getAllFiles(targetPath);
    totalFiles += files.length;
    
    for (const file of files) {
      if (processFile(file)) {
        modifiedFiles++;
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total files scanned: ${totalFiles}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  
  if (modifiedFiles > 0) {
    console.log('\n✨ Schema references have been standardized!');
    console.log('\n📋 Standard field names now used:');
    console.log('   - dolphin_id (not dolphin_asset_id)');
    console.log('   - type (not asset_type)');
    console.log('   - metadata (not asset_metadata)');
    console.log('   - asset table (not dolphin_assets)');
  } else {
    console.log('\n✅ No changes needed - schema references are already standardized!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { processFile, getAllFiles }; 