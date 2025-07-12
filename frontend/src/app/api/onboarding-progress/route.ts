import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Admin client for server-side checks
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
    // Get user's organization first
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('organization_id')
      .eq('profile_id', userId)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ 
        progress: {
          hasSetupOrganization: false,
          hasSelectedPlan: false,
          hasFundedWallet: false,
          hasAppliedForBM: false,
        },
        persistence: {
          hasExplicitlyDismissed: false,
          accountCreatedAt: user.user_metadata.created_at
        }
      });
    }

    // Fetch all data points in parallel
    const [
      walletRes,
      organizationRes,
      onboardingStateRes
    ] = await Promise.all([
      supabaseAdmin.from('wallets').select('balance_cents').eq('organization_id', profile.organization_id).limit(1).single(),
      supabaseAdmin.from('organizations').select('name').eq('organization_id', profile.organization_id).single(),
      supabaseAdmin.from('onboarding_states').select('*').eq('user_id', userId).single()
    ]);
    
    const wallet = walletRes.data;
    const organization = organizationRes.data;
    const hasFundedWallet = wallet ? wallet.balance_cents > 0 : false;
    
    // Check if organization has been properly set up (has custom name, not default)
    const hasSetupOrganization = profile.organization_id && 
      organization?.name && 
      !organization.name.includes("'s Organization");

    // Check if user has selected a plan (not on free plan)
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_id')
      .eq('organization_id', profile.organization_id)
      .eq('status', 'active')
      .single();
    
    const hasSelectedPlan = subscription && subscription.plan_id !== 'free';

    // Check if user has applied for business manager
    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select('application_id')
      .eq('organization_id', profile.organization_id)
      .limit(1);
    
    const hasAppliedForBM = applications && applications.length > 0;

    // Combine live data with persisted dismissal state
    const progress = {
        hasSetupOrganization: hasSetupOrganization || false,
        hasSelectedPlan: hasSelectedPlan || false,
        hasFundedWallet,
        hasAppliedForBM: hasAppliedForBM || false,
    };

    const persistence = {
        hasExplicitlyDismissed: onboardingStateRes.data?.has_explicitly_dismissed || false,
        accountCreatedAt: user.user_metadata.created_at
    };

    return NextResponse.json({ progress, persistence }, {
      headers: {
        'Cache-Control': 'private, max-age=300, s-maxage=300', // Cache for 5 minutes
        'Vary': 'Authorization'
      }
    });

  } catch (error) {
    console.error('Error fetching onboarding progress:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Failed to fetch onboarding progress', details: errorMessage }, { status: 500 });
  }
}

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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = user.id;
  const body = await request.json();

  if (body.action === 'dismiss') {
    try {
      // First try to update existing record
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('onboarding_states')
        .update({ 
          has_explicitly_dismissed: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select();

      // If no record was updated, insert a new one
      if (!updateData || updateData.length === 0) {
        const { error: insertError } = await supabaseAdmin
          .from('onboarding_states')
          .insert({ 
            user_id: userId, 
            has_explicitly_dismissed: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          throw insertError;
        }
      } else if (updateError) {
        throw updateError;
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error dismissing onboarding:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return NextResponse.json({ error: 'Failed to dismiss onboarding', details: errorMessage }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
} 