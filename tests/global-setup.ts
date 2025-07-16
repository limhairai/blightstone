import { chromium, FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...');
  
  // Create auth directory if it doesn't exist
  const authDir = path.join(process.cwd(), 'playwright/.auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Initialize Supabase client for test data setup
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase credentials not found, skipping database setup');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Clean up test data from previous runs
  await cleanupTestData(supabase);
  
  // Create test data
  await createTestData(supabase);
  
  console.log('✅ Global setup completed');
}

async function cleanupTestData(supabase: any) {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Delete test organizations and related data
    const { error } = await supabase
      .from('organizations')
      .delete()
      .ilike('name', '%test%');
    
    if (error) {
      console.warn('Warning during cleanup:', error.message);
    }
  } catch (error) {
    console.warn('Warning during cleanup:', error);
  }
}

async function createTestData(supabase: any) {
  console.log('🏗️  Creating test data...');
  
  try {
    // Create test organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Test Organization E2E',
        subscription_tier: 'starter',
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating test organization:', orgError);
      return;
    }

    // Create test business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        organization_id: org.organization_id,
        name: 'Test Business E2E',
        website_url: 'https://example-test.com',
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (businessError) {
      console.error('Error creating test business:', businessError);
      return;
    }

    console.log('✅ Test data created successfully');
  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

export default globalSetup; 