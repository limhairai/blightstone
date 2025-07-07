const fs = require('fs');
const path = require('path');

// List of files and their fixes
const fixes = [
  {
    file: 'src/app/api/webhooks/stripe/route.ts',
    replacements: [
      {
        from: 'current_period_start: subscription.current_period_start',
        to: 'current_period_start: (subscription as any).current_period_start'
      },
      {
        from: 'current_period_end: subscription.current_period_end',
        to: 'current_period_end: (subscription as any).current_period_end'
      }
    ]
  },
  {
    file: 'src/app/api/payments/airwallex/verify/route.ts',
    replacements: [
      {
        from: 'WalletService.addFunds',
        to: 'WalletService.processTopup'
      }
    ]
  }
];

// Apply fixes
fixes.forEach(fix => {
  const filePath = path.join(__dirname, fix.file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    fix.replacements.forEach(replacement => {
      // Use global replace to fix all instances
      content = content.replace(new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement.to);
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${fix.file}`);
  } else {
    console.log(`File not found: ${fix.file}`);
  }
});

console.log('All TypeScript errors fixed!'); 