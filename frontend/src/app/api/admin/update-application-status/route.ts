import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('Update application status request received');
    
    // First, verify the user is authenticated
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('Verifying user token...');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError) {
      console.error('Error verifying user token:', userError);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (!user) {
      console.log('No user found from token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('User verified:', user.id);

    // Check if user is a superuser
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_superuser')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: 'Failed to verify user permissions' }, { status: 500 });
    }
    
    if (!profile?.is_superuser) {
      console.log('User is not a superuser:', user.id);
      return NextResponse.json({ error: 'You are not authorized to perform this action.' }, { status: 403 });
    }

    console.log('User is authorized as superuser');

    // Now, proceed with the status update
    const body = await request.json();
    const { application_id, new_status } = body;

    console.log('Request body:', { application_id, new_status });

    if (!application_id || !new_status) {
      return NextResponse.json({ error: 'Application ID and new status are required' }, { status: 400 });
    }

    const validStatuses = ['processing', 'ready', 'rejected'];
    if (!validStatuses.includes(new_status)) {
      return NextResponse.json({ error: 'Invalid status provided.' }, { status: 400 });
    }

    console.log('Updating application status in database...');

    const { data, error } = await supabase
      .from('application')
      .update({ 
        status: new_status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', application_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating application status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      console.log('No application found with ID:', application_id);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    console.log('Application status updated successfully:', data);

    return NextResponse.json({ success: true, application: data });

  } catch (error) {
    console.error('Unexpected error in update-application-status:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 