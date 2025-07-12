#!/usr/bin/env node

/**
 * Script to toggle pricing features on/off
 * Usage: node scripts/toggle-pricing-features.js [feature] [true|false]
 */

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../frontend/src/lib/config/pricing-config.ts');

function updateFeatureFlag(feature, enabled) {
  try {
    let content = fs.readFileSync(configPath, 'utf8');
    
    const featureMap = {
      'topup-limits': 'enableTopupLimits',
      'ad-spend-fees': 'enableAdSpendFees', 
      'domain-limits': 'enableDomainLimits',
      'team-limits': 'enableTeamLimits',
      'new-pricing': 'newPricingModel.enabled'
    };
    
    const configKey = featureMap[feature];
    if (!configKey) {
      console.error(`Unknown feature: ${feature}`);
      console.error(`Available features: ${Object.keys(featureMap).join(', ')}`);
      process.exit(1);
    }
    
    if (configKey.includes('.')) {
      // Handle nested properties
      const [parent, child] = configKey.split('.');
      const regex = new RegExp(`(${parent}:\\s*{[^}]*${child}:\\s*)\\w+`, 'g');
      content = content.replace(regex, `$1${enabled}`);
    } else {
      // Handle top-level properties
      const regex = new RegExp(`(${configKey}:\\s*)\\w+`, 'g');
      content = content.replace(regex, `$1${enabled}`);
    }
    
    fs.writeFileSync(configPath, content);
    console.log(`✅ Updated ${feature} to ${enabled}`);
    
  } catch (error) {
    console.error('Error updating config:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('📋 Current pricing configuration:');
  console.log('');
  console.log('Available commands:');
  console.log('  node scripts/toggle-pricing-features.js topup-limits true|false');
  console.log('  node scripts/toggle-pricing-features.js ad-spend-fees true|false');
  console.log('  node scripts/toggle-pricing-features.js domain-limits true|false');
  console.log('  node scripts/toggle-pricing-features.js team-limits true|false');
  console.log('  node scripts/toggle-pricing-features.js new-pricing true|false');
  console.log('');
  console.log('Examples:');
  console.log('  # Disable all old features for new pricing model');
  console.log('  node scripts/toggle-pricing-features.js topup-limits false');
  console.log('  node scripts/toggle-pricing-features.js ad-spend-fees false');
  console.log('  node scripts/toggle-pricing-features.js domain-limits false');
  console.log('  node scripts/toggle-pricing-features.js team-limits false');
  console.log('');
  console.log('  # Enable 1% ad spend fee');
  console.log('  node scripts/toggle-pricing-features.js ad-spend-fees true');
  process.exit(0);
}

if (args.length !== 2) {
  console.error('Usage: node scripts/toggle-pricing-features.js [feature] [true|false]');
  process.exit(1);
}

const [feature, enabled] = args;

if (!['true', 'false'].includes(enabled)) {
  console.error('Second argument must be "true" or "false"');
  process.exit(1);
}

updateFeatureFlag(feature, enabled); 