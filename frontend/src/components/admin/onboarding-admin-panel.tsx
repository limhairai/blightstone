"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { OnboardingService } from "../../services/supabase-service"
import { useAuth } from "../../contexts/AuthContext"
import { useAppData } from "../../contexts/AppDataContext"
import { toast } from "sonner"
import { 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  User, 
  Mail, 
  Wallet, 
  Building, 
  Target,
  Settings
} from "lucide-react"

interface OnboardingProgress {
  userId: string
  userEmail: string
  userName: string
  onboardingState: {
    hasEverCompletedEmail: boolean
    hasEverFundedWallet: boolean
    hasEverCreatedBusiness: boolean
    hasEverCreatedAccount: boolean
    hasExplicitlyDismissedOnboarding: boolean
    onboardingVersion: string
    currentStep: number
    completedSteps: string[]
    lastUpdated: string | null
  }
  completedAt: string | null
  accountCreatedAt: string
  isComplete: boolean
}

export function OnboardingAdminPanel() {
  const [loading, setLoading] = useState(false)
  const [onboardingData, setOnboardingData] = useState<OnboardingProgress | null>(null)
  const { user } = useAuth()
  const { state } = useAppData()

  const loadOnboardingData = async () => {
    if (!user?.id || state.dataSource !== 'supabase') {
      return
    }

    setLoading(true)
    try {
      const data = await OnboardingService.getOnboardingProgress(user.id)
      
      if (data) {
        setOnboardingData({
          userId: user.id,
          userEmail: user.email || '',
          userName: user.user_metadata?.full_name || 'Unknown User',
          onboardingState: data.onboardingState || {
            hasEverCompletedEmail: false,
            hasEverFundedWallet: false,
            hasEverCreatedBusiness: false,
            hasEverCreatedAccount: false,
            hasExplicitlyDismissedOnboarding: false,
            onboardingVersion: '1.0',
            currentStep: 0,
            completedSteps: [],
            lastUpdated: null
          },
          completedAt: data.completedAt,
          accountCreatedAt: data.accountCreatedAt,
          isComplete: data.isComplete
        })
      }
    } catch (error) {
      console.error('Error loading onboarding data:', error)
      toast.error('Failed to load onboarding data')
    } finally {
      setLoading(false)
    }
  }

  const handleResetOnboarding = async () => {
    if (!user?.id) return

    try {
      await OnboardingService.resetOnboarding(user.id)
      await loadOnboardingData()
      toast.success('Onboarding reset successfully')
    } catch (error) {
      console.error('Error resetting onboarding:', error)
      toast.error('Failed to reset onboarding')
    }
  }

  const handleMarkStepCompleted = async (stepType: 'email' | 'wallet' | 'business' | 'account') => {
    if (!user?.id) return

    try {
      await OnboardingService.autoTrackStep(user.id, stepType)
      await loadOnboardingData()
      toast.success(`${stepType} step marked as completed`)
    } catch (error) {
      console.error('Error marking step completed:', error)
      toast.error('Failed to mark step completed')
    }
  }

  useEffect(() => {
    loadOnboardingData()
  }, [user?.id, state.dataSource])

  if (state.dataSource !== 'supabase') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Onboarding admin panel is only available in Supabase mode. 
            Current mode: {state.dataSource}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!onboardingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            {loading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading onboarding data...</span>
              </div>
            ) : (
              <p className="text-muted-foreground">No onboarding data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const completionPercentage = calculateCompletionPercentage(onboardingData.onboardingState)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Onboarding Admin Panel</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadOnboardingData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{onboardingData.userName}</div>
                <div className="text-sm text-muted-foreground">{onboardingData.userEmail}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Account Created</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(onboardingData.accountCreatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onboardingData.isComplete ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Clock className="h-4 w-4 text-orange-500" />
              )}
              <div>
                <div className="font-medium">
                  {onboardingData.isComplete ? 'Completed' : 'In Progress'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {onboardingData.completedAt 
                    ? new Date(onboardingData.completedAt).toLocaleDateString()
                    : 'Not completed'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          {/* Step Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <OnboardingStepCard
              icon={<Mail className="h-4 w-4" />}
              title="Email Verification"
              completed={onboardingData.onboardingState.hasEverCompletedEmail}
              onMarkCompleted={() => handleMarkStepCompleted('email')}
            />
            <OnboardingStepCard
              icon={<Wallet className="h-4 w-4" />}
              title="Wallet Funding"
              completed={onboardingData.onboardingState.hasEverFundedWallet}
              onMarkCompleted={() => handleMarkStepCompleted('wallet')}
            />
            <OnboardingStepCard
              icon={<Building className="h-4 w-4" />}
              title="Business Creation"
              completed={onboardingData.onboardingState.hasEverCreatedBusiness}
              onMarkCompleted={() => handleMarkStepCompleted('business')}
            />
            <OnboardingStepCard
              icon={<Target className="h-4 w-4" />}
              title="Account Setup"
              completed={onboardingData.onboardingState.hasEverCreatedAccount}
              onMarkCompleted={() => handleMarkStepCompleted('account')}
            />
          </div>

          {/* Additional Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Onboarding Version:</span>
              <Badge variant="outline">{onboardingData.onboardingState.onboardingVersion}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Current Step:</span>
              <Badge variant="outline">{onboardingData.onboardingState.currentStep}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Explicitly Dismissed:</span>
              <Badge variant={onboardingData.onboardingState.hasExplicitlyDismissedOnboarding ? "destructive" : "secondary"}>
                {onboardingData.onboardingState.hasExplicitlyDismissedOnboarding ? 'Yes' : 'No'}
              </Badge>
            </div>
            {onboardingData.onboardingState.lastUpdated && (
              <div className="flex items-center justify-between">
                <span>Last Updated:</span>
                <span className="text-muted-foreground">
                  {new Date(onboardingData.onboardingState.lastUpdated).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Admin Actions */}
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetOnboarding}
              >
                <Settings className="h-4 w-4 mr-2" />
                Reset Onboarding
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface OnboardingStepCardProps {
  icon: React.ReactNode
  title: string
  completed: boolean
  onMarkCompleted: () => void
}

function OnboardingStepCard({ icon, title, completed, onMarkCompleted }: OnboardingStepCardProps) {
  return (
    <Card className={`${completed ? 'border-green-200 bg-green-50' : 'border-border'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-full ${completed ? 'bg-green-100' : 'bg-muted'}`}>
              {icon}
            </div>
            <span className="font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {completed ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={onMarkCompleted}
              >
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function calculateCompletionPercentage(onboardingState: OnboardingProgress['onboardingState']): number {
  const steps = [
    onboardingState.hasEverCompletedEmail,
    onboardingState.hasEverFundedWallet,
    onboardingState.hasEverCreatedBusiness,
    onboardingState.hasEverCreatedAccount
  ]
  
  const completedSteps = steps.filter(Boolean).length
  return Math.round((completedSteps / steps.length) * 100)
} 