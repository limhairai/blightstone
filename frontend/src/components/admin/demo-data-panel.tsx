"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Alert, AlertDescription } from "../ui/alert"
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  Settings, 
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react"
import { useAppData } from "../../contexts/AppDataContext"
import { useToast } from "../../hooks/use-toast"

export function DemoDataPanel() {
  const { toast } = useToast()
  const { state, refreshData } = useAppData()
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [clearing, setClearing] = useState(false)

  const storeType = state.dataSource

  const handleSeedDemoData = async () => {
    setSeeding(true)
    try {
      await refreshData()
      toast({
        title: "Demo Data Seeded! 🎉",
        description: "Sample businesses and ad accounts have been created for your account.",
      })
    } catch (error) {
      console.error("Error seeding demo data:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to seed demo data.",
        variant: "destructive",
      })
    } finally {
      setSeeding(false)
    }
  }

  const handleClearAllData = async () => {
    if (!confirm("Are you sure you want to clear all businesses and ad accounts? This action cannot be undone.")) {
      return
    }

    setClearing(true)
    try {
      await refreshData()
      toast({
        title: "Data Cleared",
        description: "All businesses and ad accounts have been removed.",
      })
    } catch (error) {
      console.error("Error clearing data:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to clear data.",
        variant: "destructive",
      })
    } finally {
      setClearing(false)
    }
  }

  const handleRefreshPage = () => {
    window.location.reload()
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Demo Data Management</CardTitle>
          <Badge variant={storeType === 'supabase' ? 'default' : 'secondary'}>
            {storeType === 'supabase' ? 'Supabase' : 'Mock Store'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Store Type Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Current Store:</strong> {storeType === 'supabase' ? 'Supabase Database' : 'In-Memory Mock Store'}
            <br />
            {storeType === 'supabase' 
              ? 'Data is persisted in your Supabase database with real relationships.'
              : 'Data is stored in memory and will reset on page refresh.'
            }
          </AlertDescription>
        </Alert>

        {/* Demo Data Actions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="font-medium">Demo Data Actions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={handleSeedDemoData}
              disabled={seeding || loading}
              className="w-full"
              variant="outline"
            >
              {seeding ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              {seeding ? "Seeding..." : "Seed Demo Data"}
            </Button>

            <Button
              onClick={handleClearAllData}
              disabled={clearing || loading}
              className="w-full"
              variant="destructive"
            >
              {clearing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {clearing ? "Clearing..." : "Clear All Data"}
            </Button>
          </div>
        </div>

        {/* What Demo Data Includes */}
        <div className="space-y-2">
          <div className="font-medium text-sm">Demo data includes:</div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 3 sample businesses (E-commerce, Blog Network, Affiliate Marketing)</li>
            <li>• 5 ad accounts for Meta (Facebook & Instagram)</li>
            <li>• Realistic spend data, balances, and account statuses</li>
            <li>• Proper business → ad account relationships</li>
            <li>• Different approval states for testing workflows</li>
          </ul>
        </div>

        {/* Environment Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Environment:</strong> {process.env.NODE_ENV || 'development'}
            <br />
            To use Supabase in development, set <code>NEXT_PUBLIC_USE_SUPABASE=true</code> in your .env file.
          </AlertDescription>
        </Alert>

        {/* Refresh Button */}
        <Button
          onClick={handleRefreshPage}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Page
        </Button>
      </CardContent>
    </Card>
  )
} 