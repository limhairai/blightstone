#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySchema() {
  console.log('🔍 Verifying Supabase schema...\n');

  try {
    // Check if tables exist
    const tables = [
      'profiles',
      'organizations', 
      'organization_members',
      'businesses',
      'ad_accounts',
      'wallets',
      'transactions',
      'plans'
    ];

    console.log('📋 Checking tables...');
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Table '${table}': ${error.message}`);
        } else {
          console.log(`✅ Table '${table}': OK`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`);
      }
    }

    console.log('\n🔐 Testing authentication...');
    
    // Create a demo user
    const demoEmail = 'demo@adhub.com';
    const demoPassword = 'demo123';
    
    console.log(`Creating demo user: ${demoEmail}`);
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Demo User'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('✅ Demo user already exists');
      } else {
        console.log(`❌ Auth error: ${authError.message}`);
        return;
      }
    } else {
      console.log('✅ Demo user created successfully');
    }

    // Test sign in
    console.log('Testing sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword
    });

    if (signInError) {
      console.log(`❌ Sign in error: ${signInError.message}`);
    } else {
      console.log('✅ Sign in successful');
      
      // Check if profile was created
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', demoEmail)
        .single();

      if (profileError) {
        console.log(`❌ Profile check error: ${profileError.message}`);
      } else {
        console.log('✅ Profile created automatically');
        console.log(`   Profile ID: ${profile.id}`);
        console.log(`   Name: ${profile.name}`);
        console.log(`   Email: ${profile.email}`);
      }
    }

    console.log('\n🎉 Schema verification complete!');
    console.log('\n📝 Demo credentials for testing:');
    console.log(`   Email: ${demoEmail}`);
    console.log(`   Password: ${demoPassword}`);
    console.log('\n🌐 Access Supabase Studio: http://127.0.0.1:54323');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

verifySchema(); 