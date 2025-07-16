import { FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global E2E test teardown...');
  
  // Initialize Supabase client for cleanup
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase credentials not found, skipping database cleanup');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Clean up test data
    await cleanupTestData(supabase);
    console.log('✅ Global teardown completed');
  } catch (error) {
    console.error('❌ Error during global teardown:', error);
  }
}

async function cleanupTestData(supabase: any) {
  console.log('🗑️  Cleaning up test data...');
  
  try {
    // Delete test organizations and all related data (cascade delete)
    const { error: orgError } = await supabase
      .from('organizations')
      .delete()
      .ilike('name', '%test%');
    
    if (orgError) {
      console.warn('Warning during organization cleanup:', orgError.message);
    }

    // Delete test applications
    const { error: appError } = await supabase
      .from('application')
      .delete()
      .ilike('name', '%test%');
    
    if (appError) {
      console.warn('Warning during application cleanup:', appError.message);
    }

    // Delete test profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .ilike('full_name', '%test%');
    
    if (profileError) {
      console.warn('Warning during profile cleanup:', profileError.message);
    }

    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

export default globalTeardown; 