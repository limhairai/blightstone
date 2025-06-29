import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select('organization_id, name, created_at');

        if (error) {
            console.error('Error fetching organizations for admin:', error);
            throw error;
        }

        return NextResponse.json({ organizations: data });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
} 