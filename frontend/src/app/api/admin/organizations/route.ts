import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        // Fetch organizations first
        const { data: organizations, error } = await supabase
            .from('organizations')
            .select(`
                organization_id, 
                name, 
                created_at,
                plan_id,
                subscription_status,
                current_period_start,
                current_period_end
            `);
        
        if (error) {
            console.error('Error fetching organizations:', error);
            throw error;
        }

        // Fetch wallets separately
        const { data: wallets, error: walletError } = await supabase
            .from('wallets')
            .select('organization_id, balance_cents, reserved_balance_cents');
        
        if (walletError) {
            console.error('Error fetching wallets:', walletError);
        }

        // Create wallet map
        const walletMap = new Map();
        wallets?.forEach(wallet => {
            walletMap.set(wallet.organization_id, wallet);
        });

        // Get business manager counts for all organizations
        const { data: bmCounts, error: bmError } = await supabase
            .from('asset_binding')
            .select(`
                organization_id,
                asset!inner(type)
            `)
            .eq('asset.type', 'business_manager')
            .eq('status', 'active');

        if (bmError) {
            console.error('Error fetching business manager counts:', bmError);
        }

        // Create a map of organization_id to business manager count
        const bmCountMap = new Map<string, number>();
        bmCounts?.forEach(binding => {
            const orgId = binding.organization_id;
            bmCountMap.set(orgId, (bmCountMap.get(orgId) || 0) + 1);
        });

        // Transform organizations with additional data
        const transformedOrganizations = organizations?.map(org => {
            const wallet = walletMap.get(org.organization_id);
            const totalBalance = wallet?.balance_cents || 0;
            const reservedBalance = wallet?.reserved_balance_cents || 0;
            const availableBalance = totalBalance - reservedBalance;
            
            return {
                organization_id: org.organization_id,
                name: org.name,
                created_at: org.created_at,
                plan_id: org.plan_id,
                subscription_status: org.subscription_status,
                current_period_start: org.current_period_start,
                current_period_end: org.current_period_end,
                balance_cents: availableBalance,
                total_balance_cents: totalBalance,
                reserved_balance_cents: reservedBalance,
                business_managers_count: bmCountMap.get(org.organization_id) || 0
            };
        }) || [];

        return NextResponse.json({ organizations: transformedOrganizations });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
} 