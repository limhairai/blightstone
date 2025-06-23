import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config, shouldUseAppData, isDemoMode } from '../../../../lib/data/config';
import { buildApiUrl } from '@/lib/config/api';

// Using centralized API config

// Create Supabase client for server-side auth (only in production)
const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
) : null;

async function getAuthToken(request: NextRequest) {
  // In demo mode, return a mock token
  if (isDemoMode() || shouldUseAppData()) {
    return 'demo-access-token-123';
  }

  // Get the authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let url = buildApiUrl('/api/applications/admin/all');
    if (status) {
      url += `?status_filter=${status}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching admin applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getAuthToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { application_id, action, admin_notes } = body;

    if (!application_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: application_id and action' },
        { status: 400 }
      );
    }

    const response = await fetch(buildApiUrl(`/api/admin/applications/${application_id}/review`), {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, admin_notes }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error reviewing application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 