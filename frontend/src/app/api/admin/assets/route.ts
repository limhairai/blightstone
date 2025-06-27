import { NextRequest, NextResponse } from 'next/server';

// Use your existing backend API endpoints
const BACKEND_API_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function getAuthToken(request: NextRequest): Promise<string | null> {
  // Get token from Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

async function makeBackendRequest(endpoint: string, token: string | null, options: RequestInit = {}) {
  const url = `${BACKEND_API_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  // Add authorization header if we have a token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get('asset_type');
    
    // Extract auth token from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    // Forward request to backend with auth
    const backendUrl = `${BACKEND_API_URL}/api/dolphin-assets/all-assets`;
    const url = new URL(backendUrl);
    if (assetType) {
      url.searchParams.set('asset_type', assetType);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Return the organized data structure
    return NextResponse.json({
      status: 'success',
      business_managers: data.business_managers || [],
      facebook_profiles: data.facebook_profiles || [],
      ad_accounts: data.ad_accounts || [],
      summary: data.summary || {
        total_business_managers: 0,
        total_facebook_profiles: 0,
        total_ad_accounts: 0,
      }
    });

  } catch (error) {
    console.error('Assets API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Extract auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    if (action === 'discover') {
      // Sync/discover assets from Dolphin Cloud
      const response = await fetch(`${BACKEND_API_URL}/api/dolphin-assets/sync/discover`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force_refresh: true }),
      });

      if (!response.ok) {
        const error = await response.text();
        return NextResponse.json(
          { error: `Sync failed: ${error}` },
          { status: response.status }
        );
      }

      const result = await response.json();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Assets POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 