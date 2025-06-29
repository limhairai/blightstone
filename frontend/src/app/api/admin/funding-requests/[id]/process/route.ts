import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const requestId = params.id;

    // Update the funding request status to completed
    const { data: updatedRequest, error: updateError } = await supabase
      .from('funding_requests')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        processed_by: user.id
      })
      .eq('id', requestId)
      .eq('status', 'pending') // Only update if still pending
      .select()
      .single();

    if (updateError) {
      console.error('Error updating funding request:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!updatedRequest) {
      return NextResponse.json({ error: 'Funding request not found or already processed' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Funding request marked as processed',
      request: updatedRequest
    });

  } catch (error) {
    console.error('Error processing funding request:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 