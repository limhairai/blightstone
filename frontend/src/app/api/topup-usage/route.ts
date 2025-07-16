import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify user has access to this organization
    const { data: orgAccess, error: orgError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (orgError || !orgAccess) {
      // Check if user is owner
      const { data: ownerCheck, error: ownerError } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('organization_id', organizationId)
        .eq('owner_id', user.id)
        .single();

      if (ownerError || !ownerCheck) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Get current month's usage
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    
    const { data: topupData, error: topupError } = await supabase
      .from('topup_requests')
      .select('amount_cents')
      .eq('organization_id', organizationId)
      .in('status', ['pending', 'processing', 'completed'])
      .gte('created_at', currentMonthStart.toISOString());

    if (topupError) {
      console.error('Error fetching topup usage:', topupError);
      return NextResponse.json({ error: 'Failed to fetch topup usage' }, { status: 500 });
    }

    const currentUsageCents = topupData.reduce((sum, req) => sum + req.amount_cents, 0);

    return NextResponse.json({
      currentUsage: currentUsageCents / 100, // Convert to dollars
      currentUsageCents,
      month: currentMonthStart.toISOString().substring(0, 7) // YYYY-MM format
    });

  } catch (error) {
    console.error('Error in /api/topup-usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 