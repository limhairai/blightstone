"use client"

import { useAuth } from "../../contexts/AuthContext"
import { useAppData } from "../../contexts/AppDataContext"
import { useDemoState } from "../../contexts/DemoStateContext"

export function DashboardDebug() {
  const { user, session, loading: authLoading } = useAuth()
  const { appUser, organizations, currentOrg, loading: appDataLoading, error } = useAppData()
  const { state } = useDemoState()

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">Dashboard Debug Info</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Auth Status:</strong>
          <div>Loading: {authLoading ? 'Yes' : 'No'}</div>
          <div>User: {user ? 'Logged in' : 'Not logged in'}</div>
          <div>Session: {session ? 'Active' : 'None'}</div>
          <div>User ID: {user?.id || 'None'}</div>
        </div>

        <div>
          <strong>App Data Status:</strong>
          <div>Loading: {appDataLoading ? 'Yes' : 'No'}</div>
          <div>Error: {error || 'None'}</div>
          <div>App User: {appUser ? 'Loaded' : 'None'}</div>
          <div>Organizations: {organizations.length}</div>
          <div>Current Org: {currentOrg?.name || 'None'}</div>
        </div>

        <div>
          <strong>Demo State:</strong>
          <div>Wallet Balance: ${state.financialData.walletBalance}</div>
          <div>Accounts: {state.accounts.length}</div>
          <div>Businesses: {state.businesses.length}</div>
        </div>

        <div>
          <strong>Environment:</strong>
          <div>NODE_ENV: {process.env.NODE_ENV}</div>
          <div>Backend URL: {process.env.BACKEND_API_URL || 'Not set'}</div>
        </div>
      </div>
    </div>
  )
} 