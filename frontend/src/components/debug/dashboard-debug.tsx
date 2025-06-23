"use client"

import { useAuth } from "../../contexts/AuthContext"
import { useAppData } from "../../contexts/AppDataContext"
import { isDemoMode } from "../../lib/data/config"

export function DashboardDebug() {
  const { user, session, loading: authLoading } = useAuth()
  const { state } = useAppData()
  const appDataLoading = state.loading.organizations

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
        
        <div>
          <strong>User:</strong> {state.userProfile?.email || "None"}
        </div>
        
        <div>
          <strong>Orgs:</strong> {state.organizations?.length || 0}
        </div>
        
        <div>
          <strong>Current Org:</strong> {state.currentOrganization?.name || "None"}
        </div>
        
        <div>
          <strong>Data Source:</strong> {state.dataSource}
        </div>
        
                 <div>
           <strong>Demo Mode:</strong> {isDemoMode() ? "✓" : "✗"}
         </div>
      </div>
    </div>
  )
} 