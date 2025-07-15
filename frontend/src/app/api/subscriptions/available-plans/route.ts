import { NextResponse } from 'next/server'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for testing and small projects',
    monthlyPrice: 29,
    adSpendFee: 6.0,
    maxTeamMembers: 2,
    maxBusinesses: 3,
    maxAdAccounts: 10,
    monthlyTopupLimit: 3000, // $3,000 monthly top-up limit
    features: ['Basic Support', 'Standard Features', '$3,000 monthly top-up limit']
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Great for growing businesses',
    monthlyPrice: 149,
    adSpendFee: 3.0,
    maxTeamMembers: 5,
    maxBusinesses: 5,
    maxAdAccounts: 25,
    monthlyTopupLimit: 6000, // $6,000 monthly top-up limit
    features: ['Priority Support', 'Advanced Analytics', 'Team Collaboration', '$6,000 monthly top-up limit']
  },
  {
    id: 'scale',
    name: 'Scale',
    description: 'For established businesses',
    monthlyPrice: 499,
    adSpendFee: 1.5,
    maxTeamMembers: 15,
    maxBusinesses: 15,
    maxAdAccounts: 75,
    monthlyTopupLimit: null, // Unlimited
    features: ['Dedicated Support', 'Custom Integrations', 'Advanced Reporting', 'Unlimited monthly top-ups']
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'For large organizations',
    monthlyPrice: 0,
    adSpendFee: 0,
    maxTeamMembers: -1,
    maxBusinesses: -1,
    maxAdAccounts: -1,
    monthlyTopupLimit: null, // Unlimited
    features: ['24/7 Support', 'Custom Features', 'Unlimited Everything', 'Unlimited monthly top-ups'],
    isCustom: true
  }
]

export async function GET() {
  return NextResponse.json({ plans })
} 