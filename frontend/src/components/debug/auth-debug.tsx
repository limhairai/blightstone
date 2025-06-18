"use client"

import { useAuth } from "../../contexts/AuthContext"
import { useAppData } from "../../contexts/ProductionDataContext"
import { useState } from "react"

export function AuthDebug() {
  const { user, session, loading: authLoading } = useAuth()
  const { appUser, loading: appDataLoading, error: appDataError } = useAppData()
  const [testResult, setTestResult] = useState<string>("")

  const testBackendConnection = async () => {
    if (!session?.access_token) {
      setTestResult("No session token available")
      return
    }

    try {
      const response = await fetch('/api/proxy/users/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.text()
      setTestResult(`Status: ${response.status}, Response: ${result}`)
    } catch (error) {
      setTestResult(`Error: ${error}`)
    }
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      
      <div className="space-y-1">
        <div>Auth Loading: {authLoading ? "Yes" : "No"}</div>
        <div>User: {user ? `${user.email} (${user.id})` : "None"}</div>
        <div>Session: {session ? "Yes" : "No"}</div>
        <div>Token: {session?.access_token ? `${session.access_token.substring(0, 20)}...` : "None"}</div>
        
        <hr className="my-2" />
        
        <div>AppData Loading: {appDataLoading ? "Yes" : "No"}</div>
        <div>AppUser: {appUser ? `${appUser.email}` : "None"}</div>
        <div>AppData Error: {appDataError || "None"}</div>
        
        <hr className="my-2" />
        
        <button 
          onClick={testBackendConnection}
          className="bg-blue-600 px-2 py-1 rounded text-xs"
        >
          Test Backend
        </button>
        
        {testResult && (
          <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
            {testResult}
          </div>
        )}
      </div>
    </div>
  )
} 