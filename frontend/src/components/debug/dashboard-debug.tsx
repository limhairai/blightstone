"use client"

import { useAuth } from "../../contexts/AuthContext"
import { useAppData } from "../../contexts/ProductionDataContext"
import { useDemoState } from "../../contexts/DemoStateContext"
import { isDemoMode } from "../../lib/data/config"

export function DashboardDebug() {
  const { user, session, loading: authLoading } = useAuth()
  const { appUser, organizations, currentOrg, loading: appDataLoading, error } = useAppData()
  const { state: demoState } = useDemoState()

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-background border rounded-lg shadow-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Debug Info</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Auth:</strong> {authLoading ? "Loading..." : user ? "✓" : "✗"}
        </div>
        
        <div>
          <strong>Session:</strong> {session ? "✓" : "✗"}
        </div>
        
        <div>
          <strong>App Data:</strong> {appDataLoading ? "Loading..." : "✓"}
        </div>
        
        {error && (
          <div className="text-red-500">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div>
          <strong>User:</strong> {appUser?.email || "None"}
        </div>
        
        <div>
          <strong>Orgs:</strong> {organizations?.length || 0}
        </div>
        
        <div>
          <strong>Current Org:</strong> {currentOrg?.name || "None"}
        </div>
        
                 <div>
           <strong>Demo Mode:</strong> {isDemoMode() ? "✓" : "✗"}
         </div>
      </div>
    </div>
  )
} 