#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get all UI component files
const uiComponentsDir = path.join(__dirname, '../src/components/ui');
const srcDir = path.join(__dirname, '../src');

function getAllFiles(dir, extension = '.tsx') {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getAllFiles(fullPath, extension));
    } else if (item.endsWith(extension) || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Get all UI components
const uiComponents = fs.readdirSync(uiComponentsDir)
  .filter(file => file.endsWith('.tsx'))
  .map(file => file.replace('.tsx', ''));

console.log(`Found ${uiComponents.length} UI components`);

// Get all source files
const allSourceFiles = getAllFiles(srcDir);

// Check which components are actually used
const unusedComponents = [];
const usedComponents = [];

for (const component of uiComponents) {
  let isUsed = false;
  
  // Check if component is imported/used anywhere
  for (const file of allSourceFiles) {
    if (file.includes('/components/ui/')) continue; // Skip the component file itself
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for various import patterns
      const importPatterns = [
        new RegExp(`from ['"]@/components/ui/${component}['"]`, 'g'),
        new RegExp(`import.*${component}.*from`, 'g'),
        new RegExp(`<${component}[\\s>]`, 'g'), // Component usage
      ];
      
      if (importPatterns.some(pattern => pattern.test(content))) {
        isUsed = true;
        break;
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  if (isUsed) {
    usedComponents.push(component);
  } else {
    unusedComponents.push(component);
  }
}

console.log('\n🟢 Used components:', usedComponents.length);
console.log(usedComponents.join(', '));

console.log('\n🔴 Unused components:', unusedComponents.length);
console.log(unusedComponents.join(', '));

if (unusedComponents.length > 0) {
  console.log('\n💡 You can potentially remove these unused components to reduce bundle size:');
  unusedComponents.forEach(component => {
    console.log(`  - src/components/ui/${component}.tsx`);
  });
  
  console.log(`\n📊 Potential bundle size reduction: ~${unusedComponents.length * 2}KB (estimated)`);
}

// Check for duplicate/similar components
console.log('\n🔍 Checking for potential duplicates...');
const potentialDuplicates = [];

for (let i = 0; i < uiComponents.length; i++) {
  for (let j = i + 1; j < uiComponents.length; j++) {
    const comp1 = uiComponents[i].toLowerCase();
    const comp2 = uiComponents[j].toLowerCase();
    
    // Check for similar names that might be duplicates
    if (comp1.includes(comp2) || comp2.includes(comp1) || 
        comp1.replace('-', '') === comp2.replace('-', '') ||
        comp1.includes('enhanced') || comp2.includes('enhanced')) {
      potentialDuplicates.push([uiComponents[i], uiComponents[j]]);
    }
  }
}

if (potentialDuplicates.length > 0) {
  console.log('⚠️  Potential duplicate components:');
  potentialDuplicates.forEach(([comp1, comp2]) => {
    console.log(`  - ${comp1} ↔ ${comp2}`);
  });
} 