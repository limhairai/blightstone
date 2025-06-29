#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing API Route Syntax Errors');
console.log('===================================\n');

// Fix config.ts
const configPath = 'src/lib/data/config.ts';
const fixedConfig = `// Environment configuration for AdHub
export const config = {
  environment: "development",
  useMockData: true,
  demoMode: true,
  apiUrl: 'http://localhost:8000',
  supabaseUrl: "supabase-url", // Server-side only
  supabaseAnonKey: "supabase-anon-key" // Server-side only
};

// Environment detection helpers
export const isStaging = () => config.environment === 'staging';
export const isProduction = () => config.environment === 'production';
export const isDevelopment = () => config.environment === 'development';
export const shouldUseAppData = () => config.useMockData || isDevelopment();
export const isDemoMode = () => config.demoMode;

// API configuration
export const getApiUrl = () => {
  if (shouldUseAppData()) {
    return null; // No API calls in mock mode
  }
  return config.apiUrl;
};

// Debug logging (only in development)
if (isDevelopment()) {
  console.log('🔧 AdHub Config:', {
    environment: config.environment,
    useMockData: config.useMockData,
    demoMode: config.demoMode,
    apiUrl: config.apiUrl
  });
}
`;

fs.writeFileSync(configPath, fixedConfig);
console.log('✅ Fixed config.ts syntax');

// Fix API routes
const apiRoutes = [
  'src/app/api/ad-accounts/route.ts',
  'src/app/api/admin/applications/route.ts', 
  'src/app/api/applications/route.ts',
  'src/app/api/businesses/route.ts'
];

apiRoutes.forEach(routePath => {
  if (fs.existsSync(routePath)) {
    let content = fs.readFileSync(routePath, 'utf8');
    
    // Fix Supabase client creation syntax
    content = content.replace(
      /const supabase = "supabase-service-role-key" \? createClient\(\s*"supabase-url" \/\/ Server-side only!,\s*"supabase-service-role-key"!\s*\) : null;/g,
      `const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
) : null;`
    );
    
    fs.writeFileSync(routePath, content);
    console.log(`✅ Fixed ${path.basename(routePath)} syntax`);
  }
});

console.log('\n🎉 All syntax errors fixed!');
