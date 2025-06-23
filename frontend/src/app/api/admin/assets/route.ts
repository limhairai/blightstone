import { NextRequest, NextResponse } from 'next/server';
import { config, shouldUseAppData, isDemoMode } from '../../../../lib/data/config';
import { buildApiUrl } from '@/lib/config/api';

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
    const assetType = searchParams.get('asset_type');
    const assigned = searchParams.get('assigned');

    let url = buildApiUrl('/api/dolphin-assets');
    
    // Handle different assignment filters
    if (assigned === 'false') {
      url += '/unassigned';
    } else if (assigned === 'true') {
      url += '/assigned';
    } else if (assigned === 'all') {
      // Fetch all assets - use the base endpoint
      url += '/all';
    } else {
      // Default to unassigned for backward compatibility
      url += '/unassigned';
    }
    
    const params = new URLSearchParams();
    if (assetType) {
      params.append('asset_type', assetType);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
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
    console.error('Error fetching admin assets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getAuthToken(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    let url = buildApiUrl('/api/dolphin-assets');
    
    if (action === 'discover') {
      url += '/sync/discover';
    } else if (action === 'bind') {
      url += '/bind';
    } else if (action === 'unbind') {
      url += `/unbind/${body.binding_id}`;
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in admin assets action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 