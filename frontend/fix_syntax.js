const fs = require('fs');

let content = fs.readFileSync('src/components/admin/application-asset-binding-dialog.tsx', 'utf8');

// Fix the syntax error
content = content.replace(
  /    }\s*Temporarily commented out for debugging\s*if \(selectedAdAccounts\.length === 0\) {\s*setError\("Please select at least one ad account to assign\."\)\s*\/\/ }/g,
  `    }

    if (selectedAdAccounts.length === 0) {
      setError("Please select at least one ad account to assign.")
      return
    }`
);

fs.writeFileSync('src/components/admin/application-asset-binding-dialog.tsx', content);
console.log('Fixed syntax error');
