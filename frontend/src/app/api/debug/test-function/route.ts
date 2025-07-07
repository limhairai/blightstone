import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role to bypass RLS entirely
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing is_admin function...')
    
    // Test 1: Check if function exists
    const { data: functions, error: fnError } = await supabase
      .rpc('is_admin', { user_id: '00000000-0000-0000-0000-000000000000' }) // Dummy UUID
      
    console.log('🧪 Function test result:', { functions, fnError })
    
    // Test 2: Try with your actual user ID (replace with your UUID)
    const yourUserId = '09ec78f8-c86e-4734-b136-5a6dd94c8ac1' // From your earlier debug
    const { data: adminResult, error: adminError } = await supabase
      .rpc('is_admin', { user_id: yourUserId })
      
    console.log('🧪 Your admin status:', { adminResult, adminError })
    
    // Test 3: Direct profile query with service role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('profile_id, email, is_superuser')
      .eq('profile_id', yourUserId)
      .single()
      
    console.log('🧪 Direct profile query:', { profile, profileError })
    
    return NextResponse.json({
      functionExists: !fnError,
      functionError: fnError?.message,
      adminResult,
      adminError: adminError?.message,
      profile,
      profileError: profileError?.message,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('🧪 Test function error:', error)
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 