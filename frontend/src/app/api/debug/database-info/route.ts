import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role to get full database info
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🗄️ Checking database info...')
    
    const info: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }

    // Test 1: Check if we can connect to the database
    try {
      const { data: connectionTest, error: connError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      info.databaseConnection = {
        connected: !connError,
        error: connError?.message || null
      }
    } catch (e) {
      info.databaseConnection = {
        connected: false,
        error: e instanceof Error ? e.message : 'Unknown connection error'
      }
    }

    // Test 2: Check what tables exist
    try {
      const { data: tables, error: tableError } = await supabase
        .rpc('get_schema_tables') // This might not exist, but let's try
        
      info.customFunction = { exists: !tableError, error: tableError?.message }
    } catch (e) {
      info.customFunction = { exists: false, error: 'Function does not exist' }
    }

    // Test 3: Check profiles table schema
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
      
      info.profilesTable = {
        exists: !profileError,
        error: profileError?.message || null,
        sampleData: profiles?.[0] || null,
        hasSemanticId: profiles?.[0]?.profile_id ? true : false,
        hasGenericId: profiles?.[0]?.id ? true : false
      }
    } catch (e) {
      info.profilesTable = {
        exists: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    }

    // Test 4: Check if is_admin function exists
    try {
      const { data: adminFunc, error: adminError } = await supabase
        .rpc('is_admin', { user_id: '00000000-0000-0000-0000-000000000000' })
        
      info.isAdminFunction = {
        exists: !adminError,
        error: adminError?.message || null,
        result: adminFunc
      }
    } catch (e) {
      info.isAdminFunction = {
        exists: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    }

    // Test 5: Check organizations table
    try {
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .limit(1)
      
      info.organizationsTable = {
        exists: !orgError,
        error: orgError?.message || null,
        sampleData: orgs?.[0] || null,
        hasSemanticId: orgs?.[0]?.organization_id ? true : false,
        hasGenericId: orgs?.[0]?.id ? true : false
      }
    } catch (e) {
      info.organizationsTable = {
        exists: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    }

    // Test 6: Check if this is a fresh database or has data
    try {
      const { count: profileCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      const { count: orgCount } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        
      info.dataState = {
        profileCount: profileCount || 0,
        organizationCount: orgCount || 0,
        isEmpty: (profileCount || 0) === 0 && (orgCount || 0) === 0
      }
    } catch (e) {
      info.dataState = {
        error: e instanceof Error ? e.message : 'Could not check data state'
      }
    }

    console.log('🗄️ Database info:', JSON.stringify(info, null, 2))
    return NextResponse.json(info)
    
  } catch (error) {
    console.error('🗄️ Database info error:', error)
    return NextResponse.json({
      error: 'Failed to get database info',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 