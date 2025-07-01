import { NextResponse } from 'next/server'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for testing and small projects',
    monthlyPrice: 29,
    adSpendFee: 6.0,
    maxTeamMembers: 2,
    maxBusinesses: 1,
    maxAdAccounts: 5,
    features: ['Basic Support', 'Standard Features']
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Great for growing businesses',
    monthlyPrice: 149,
    adSpendFee: 3.0,
    maxTeamMembers: 5,
    maxBusinesses: 3,
    maxAdAccounts: 21,
    features: ['Priority Support', 'Advanced Analytics', 'Team Collaboration']
  },
  {
    id: 'scale',
    name: 'Scale',
    description: 'For established businesses',
    monthlyPrice: 499,
    adSpendFee: 1.5,
    maxTeamMembers: 15,
    maxBusinesses: 10,
    maxAdAccounts: 70,
    features: ['Dedicated Support', 'Custom Integrations', 'Advanced Reporting']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations',
    monthlyPrice: 1499,
    adSpendFee: 1.0,
    maxTeamMembers: -1,
    maxBusinesses: -1,
    maxAdAccounts: -1,
    features: ['24/7 Support', 'Custom Features', 'Unlimited Everything']
  }
]

export async function GET() {
  return NextResponse.json({ plans })
} 