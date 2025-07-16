import { test as cleanup } from '@playwright/test';
import fs from 'fs';
import path from 'path';

cleanup('remove auth files', async () => {
  console.log('🧹 Cleaning up authentication files...');
  
  const authFiles = [
    'playwright/.auth/user.json',
    'playwright/.auth/admin.json',
  ];
  
  for (const authFile of authFiles) {
    const filePath = path.join(process.cwd(), authFile);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed ${authFile}`);
    }
  }
  
  console.log('✅ Authentication cleanup completed');
}); 