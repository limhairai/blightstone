import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin/superuser
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_superuser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { status, approved_amount, admin_notes } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Update the funding request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('funding_requests')
      .update({
        status,
        approved_amount_cents: status === 'approved' && approved_amount ? approved_amount * 100 : null,
        admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq('request_id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating topup request:', updateError);
      return NextResponse.json({ error: 'Failed to update topup request' }, { status: 500 });
    }

    // Transform the response to match the expected format
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', updatedRequest.user_id)
      .single();

    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('organization_id', updatedRequest.organization_id)
      .single();

    // Parse ad account info from notes
    let adAccountName = 'Account Name Not Available';
    let adAccountId = 'Account ID Not Available';
    let businessManagerName = 'Unknown BM';
    let businessManagerId = 'Unknown BM ID';

    if (updatedRequest.notes) {
      const accountNameMatch = updatedRequest.notes.match(/Top-up request for ad account:\s*([^(]+)/);
      const accountIdMatch = updatedRequest.notes.match(/\(([^)]+)\)/);
      
      if (accountNameMatch) {
        adAccountName = accountNameMatch[1].trim();
      }
      if (accountIdMatch) {
        adAccountId = accountIdMatch[1].trim();
      }
    }

    const transformedRequest = {
      id: updatedRequest.request_id,
      organization_id: updatedRequest.organization_id,
      requested_by: updatedRequest.user_id,
      ad_account_id: adAccountId,
      ad_account_name: adAccountName,
      amount_cents: updatedRequest.requested_amount_cents || 0,
      currency: 'USD',
      status: updatedRequest.status,
      priority: 'normal',
      notes: updatedRequest.notes,
      admin_notes: updatedRequest.admin_notes,
      processed_by: null,
      processed_at: null,
      created_at: updatedRequest.created_at,
      updated_at: updatedRequest.updated_at,
      
      // Additional fields for UI
      requested_by_user: {
        email: userProfile?.email || 'Unknown Email',
        full_name: userProfile?.name
      },
      organization: {
        name: organization?.name || 'Unknown Organization'
      },
      metadata: {
        business_manager_name: businessManagerName,
        business_manager_id: businessManagerId
      }
    };

    return NextResponse.json(transformedRequest);

  } catch (error) {
    console.error('Error in topup-requests PATCH API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 