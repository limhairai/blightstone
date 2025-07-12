import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

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
      .eq('profile_id', user.id)
      .single();

    const isAdmin = profile?.is_superuser === true;

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Get the request first to check ownership
    const { data: existingRequest, error: fetchError } = await supabase
      .from('topup_requests')
      .select('*')
      .eq('request_id', id)
      .single();

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Allow users to cancel their own pending requests, or admins to do anything
    const canCancel = (
      status === 'cancelled' && 
      existingRequest.status === 'pending' && 
      existingRequest.requested_by === user.id
    );

    if (!isAdmin && !canCancel) {
      return NextResponse.json({ 
        error: 'You can only cancel your own pending requests' 
      }, { status: 403 });
    }

    // Update the topup request
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    // Only admins can set admin notes and processed_by
    if (isAdmin) {
  
      updateData.processed_by = user.id;
      updateData.processed_at = new Date().toISOString();
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from('topup_requests')
      .update(updateData)
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
      .eq('profile_id', updatedRequest.requested_by)
      .single();

    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('organization_id', updatedRequest.organization_id)
      .single();

    const transformedRequest = {
      id: updatedRequest.request_id,
      organization_id: updatedRequest.organization_id,
      requested_by: updatedRequest.requested_by,
      ad_account_id: updatedRequest.ad_account_id,
      ad_account_name: updatedRequest.ad_account_name,
      amount_cents: updatedRequest.amount_cents,
      currency: updatedRequest.currency,
      status: updatedRequest.status,
      priority: updatedRequest.priority,
      notes: updatedRequest.notes,
      
      processed_by: updatedRequest.processed_by,
      processed_at: updatedRequest.processed_at,
      created_at: updatedRequest.created_at,
      updated_at: updatedRequest.updated_at,
      metadata: updatedRequest.metadata,
      
      // Fee tracking fields
      fee_amount_cents: updatedRequest.fee_amount_cents || 0,
      total_deducted_cents: updatedRequest.total_deducted_cents || 0,
      plan_fee_percentage: updatedRequest.plan_fee_percentage || 0,
      
      // Additional fields for UI
      requested_by_user: {
        email: userProfile?.email || 'Unknown Email',
        full_name: userProfile?.name
      },
      organization: {
        name: organization?.name || 'Unknown Organization'
      }
    };

    return NextResponse.json(transformedRequest);

  } catch (error) {
    console.error('Error in topup-requests PATCH API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 