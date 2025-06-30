const fs = require('fs');
const path = require('path');

// Files to update with correct schema
const filesToUpdate = [
  'src/components/admin/application-asset-binding-dialog.tsx',
  'src/services/supabase-service.ts',
  'src/types/ad-account.ts',
  'src/app/api/admin/unbound-assets/route.ts',
  'src/app/admin/assets/page.tsx'
];

function standardizeFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace incorrect field names with correct ones
  const replacements = [
    // Field name standardization
    [/asset_type/g, 'type'],
    [/dolphin_asset_id/g, 'dolphin_id'], 
    [/asset_metadata/g, 'metadata'],
    [/asset_id(?!\s*[:=])/g, 'id'], // Don't replace in object keys
    
    // Fix specific patterns
    [/asset\.asset_type/g, 'asset.type'],
    [/asset\.dolphin_asset_id/g, 'asset.dolphin_id'],
    [/asset\.asset_metadata/g, 'asset.metadata'],
    [/selectedBM\.dolphin_asset_id/g, 'selectedBM.dolphin_id'],
    [/selectedBM\.asset_id/g, 'selectedBM.id'],
    
    // Fix filter conditions
    [/asset\.asset_type === 'business_manager'/g, "asset.type === 'business_manager'"],
    [/asset\.asset_type === 'ad_account'/g, "asset.type === 'ad_account'"],
    
    // Fix metadata access
    [/asset\.asset_metadata\?\.business_manager_id/g, 'asset.metadata?.business_manager_id'],
    [/!asset\.asset_metadata\?\.business_manager_id/g, '!asset.metadata?.business_manager_id'],
  ];

  replacements.forEach(([pattern, replacement]) => {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`);
  }
}

// Update each file
filesToUpdate.forEach(standardizeFile);

console.log('\n🎯 Schema standardization complete!');
console.log('📋 Standard schema:');
console.log('   - type (not asset_type)');
console.log('   - dolphin_id (not dolphin_asset_id)');
console.log('   - metadata (not asset_metadata)');
console.log('   - id for primary keys');
