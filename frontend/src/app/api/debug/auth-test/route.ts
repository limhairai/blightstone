import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json({ 
        error: 'No Authorization header',
        message: 'This is a debug endpoint for testing authentication. Include Authorization: Bearer <token> header.'
      }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Skip processing obviously invalid tokens to avoid log spam during development
    if (token === 'test-token' || token.length < 50 || !token.includes('.')) {
      return NextResponse.json({ 
        error: 'Invalid token format',
        message: 'Token must be a valid JWT format with at least 50 characters'
      }, { status: 401 });
    }
    
    // Only proceed with actual Supabase auth if we have a properly formatted token
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('🔍 Testing auth with token:', token.substring(0, 20) + '...');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError) {
      console.error('❌ Auth error:', userError.message);
      return NextResponse.json({ 
        error: 'Authentication failed', 
        details: userError.message 
      }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'No user found' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('profile_id', user.id)
      .single();

    // Get organization memberships
    const { data: memberships, error: membershipError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', user.id);

    // Get owned organizations
    const { data: ownedOrgs, error: ownedError } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', user.id);

    return NextResponse.json({
      success: true,
      user_id: user.id,
      user_email: user.email,
      profile: profile || null,
      profile_error: profileError?.message || null,
      memberships: memberships || [],
      membership_error: membershipError?.message || null,
      owned_organizations: ownedOrgs || [],
      owned_error: ownedError?.message || null,
      token_preview: token.substring(0, 20) + '...'
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('🔍 Auth test error:', msg);
    return NextResponse.json({ 
      error: 'Auth test failed', 
      details: msg 
    }, { status: 500 });
  }
} 