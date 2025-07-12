import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase
    // console.log('Verifying user token...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      // console.log('No user found from token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is a superuser
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('profile_id', user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'Failed to verify user permissions' }, { status: 500 });
    }
    
    if (!profile?.is_superuser) {
      return NextResponse.json({ error: 'You are not authorized to perform this action.' }, { status: 403 });
    }

    // Now, proceed with the status update
    const body = await request.json();
    const { application_id, new_status } = body;

    if (!application_id || !new_status) {
      return NextResponse.json({ error: 'Application ID and new status are required' }, { status: 400 });
    }

    const validStatuses = ['processing', 'ready', 'rejected'];
    if (!validStatuses.includes(new_status)) {
      return NextResponse.json({ error: 'Invalid status provided.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('application')
      .update({ 
        status: new_status, 
        updated_at: new Date().toISOString() 
      })
      .eq('application_id', application_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating application status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, application: data });

  } catch (error) {
    console.error('Unexpected error in update-application-status:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 