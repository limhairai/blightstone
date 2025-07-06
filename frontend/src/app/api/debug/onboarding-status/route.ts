import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const userId = user.id;

  try {
    // Get user's profile and organization
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('profile_id', userId)
      .single();

    // Get onboarding state
    const { data: onboardingState, error: onboardingError } = await supabaseAdmin
      .from('onboarding_states')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get wallet info
    let walletInfo = null;
    if (profile?.organization_id) {
      const { data: wallet } = await supabaseAdmin
        .from('wallets')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .single();
      walletInfo = wallet;
    }

    // Get business managers
    let businessManagers = [];
    if (profile?.organization_id) {
      const { data: bms } = await supabaseAdmin
        .rpc('get_organization_assets', { 
          p_organization_id: profile.organization_id, 
          p_asset_type: 'business_manager' 
        });
      businessManagers = bms || [];
    }

    // Get ad accounts
    let adAccounts = [];
    if (profile?.organization_id) {
      const { data: ads } = await supabaseAdmin
        .rpc('get_organization_assets', { 
          p_organization_id: profile.organization_id, 
          p_asset_type: 'ad_account' 
        });
      adAccounts = ads || [];
    }

    const debugInfo = {
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.user_metadata.email_confirmed_at,
        created_at: user.created_at
      },
      profile: profile || null,
      profileError: profileError?.message || null,
      onboardingState: onboardingState || null,
      onboardingError: onboardingError?.message || null,
      wallet: walletInfo,
      businessManagers: businessManagers,
      adAccounts: adAccounts,
      progress: {
        hasVerifiedEmail: !!user.user_metadata.email_confirmed_at,
        hasCreatedBusiness: businessManagers.length > 0,
        hasFundedWallet: walletInfo ? walletInfo.balance_cents > 0 : false,
        hasCreatedAdAccount: adAccounts.length > 0,
      },
      shouldShowOnboarding: {
        hasData: !!profile,
        isComplete: false, // Will calculate below
        hasExplicitlyDismissed: onboardingState?.has_explicitly_dismissed || false,
      }
    };

    // Calculate if onboarding is complete
    const completedSteps = Object.values(debugInfo.progress).filter(Boolean).length;
    const totalSteps = Object.keys(debugInfo.progress).length;
    debugInfo.shouldShowOnboarding.isComplete = completedSteps === totalSteps;

    // Final decision
    const shouldShow = !debugInfo.shouldShowOnboarding.isComplete && 
                      !debugInfo.shouldShowOnboarding.hasExplicitlyDismissed &&
                      debugInfo.shouldShowOnboarding.hasData;

    debugInfo.shouldShowOnboarding = {
      ...debugInfo.shouldShowOnboarding,
      finalDecision: shouldShow,
      reason: shouldShow ? 'Should show' : 
              debugInfo.shouldShowOnboarding.isComplete ? 'All steps completed' :
              debugInfo.shouldShowOnboarding.hasExplicitlyDismissed ? 'User dismissed' :
              !debugInfo.shouldShowOnboarding.hasData ? 'No profile data' : 'Unknown'
    };

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Add a POST method to reset onboarding state for testing
export async function POST(request: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await request.json();
  
  if (body.action === 'reset') {
    try {
      // Delete the onboarding state to reset it
      const { error } = await supabaseAdmin
        .from('onboarding_states')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      return NextResponse.json({ success: true, message: 'Onboarding state reset' });
    } catch (error) {
      console.error('Reset error:', error);
      return NextResponse.json({ 
        error: 'Reset failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
} 