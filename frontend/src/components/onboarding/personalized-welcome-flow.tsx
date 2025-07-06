'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Building2, Target, TrendingUp, Users, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface UserGoal {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  badge?: string
  steps: string[]
}

interface PersonalizedWelcomeFlowProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (selectedGoals: string[]) => void
}

const USER_GOALS: UserGoal[] = [
  {
    id: 'scale-business',
    title: 'Scale My Business',
    description: 'I want to grow my existing business with Facebook ads',
    icon: <TrendingUp className="h-5 w-5" />,
    badge: 'Popular',
    steps: [
      'Create business profile',
      'Connect existing Facebook ad accounts',
      'Set up conversion tracking',
      'Optimize ad spend'
    ]
  },
  {
    id: 'new-business',
    title: 'Launch New Business',
    description: 'I\'m starting fresh and need everything set up',
    icon: <Building2 className="h-5 w-5" />,
    steps: [
      'Create business profile',
      'Apply for new ad accounts',
      'Set up payment methods',
      'Launch first campaigns'
    ]
  },
  {
    id: 'manage-clients',
    title: 'Manage Client Accounts',
    description: 'I\'m an agency managing multiple client accounts',
    icon: <Users className="h-5 w-5" />,
    badge: 'Agency',
    steps: [
      'Set up team access',
      'Connect client business managers',
      'Organize client accounts',
      'Set up reporting'
    ]
  },
  {
    id: 'optimize-performance',
    title: 'Optimize Performance',
    description: 'I want to improve my current ad performance',
    icon: <Target className="h-5 w-5" />,
    steps: [
      'Import existing campaigns',
      'Set up performance tracking',
      'Identify optimization opportunities',
      'Implement improvements'
    ]
  }
]

export function PersonalizedWelcomeFlow({ 
  isOpen, 
  onClose, 
  onComplete 
}: PersonalizedWelcomeFlowProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const { user } = useAuth()

  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 
                   user?.email?.split('@')[0] || 
                   'there'

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    )
  }

  const handleContinue = () => {
    if (selectedGoals.length === 0) {
      return // Require at least one selection
    }
    
    setCurrentStep(1)
  }

  const handleComplete = async () => {
    try {
      // Save user preferences
      await fetch('/api/user-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          goals: selectedGoals,
          onboardingPersonalized: true
        })
      })
      
      onComplete(selectedGoals)
    } catch (error) {
      console.error('Failed to save preferences:', error)
      onComplete(selectedGoals) // Continue anyway
    }
  }

  const selectedGoalData = USER_GOALS.filter(goal => selectedGoals.includes(goal.id))

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Welcome to AdHub</DialogTitle>
        </DialogHeader>

        {currentStep === 0 && (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Welcome to AdHub, {userName}!</h2>
                <p className="text-muted-foreground">
                  Let's personalize your experience. What brings you here today?
                </p>
              </div>
            </div>

            {/* Goal Selection */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Select what you want to accomplish:</p>
              <div className="grid gap-3">
                {USER_GOALS.map((goal) => (
                  <Card 
                    key={goal.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedGoals.includes(goal.id) 
                        ? 'ring-2 ring-violet-500 bg-violet-50' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleGoalToggle(goal.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedGoals.includes(goal.id)
                            ? 'bg-violet-500 text-white'
                            : 'bg-muted'
                        }`}>
                          {goal.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{goal.title}</h3>
                            {goal.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {goal.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {goal.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                You can change these later in settings
              </p>
              <Button 
                onClick={handleContinue}
                disabled={selectedGoals.length === 0}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Perfect! Here's your personalized plan</h2>
                <p className="text-muted-foreground">
                  We'll guide you through these steps to reach your goals
                </p>
              </div>
            </div>

            {/* Personalized Steps */}
            <div className="space-y-4">
              {selectedGoalData.map((goal, index) => (
                <div key={goal.id} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center">
                      {goal.icon}
                    </div>
                    <h3 className="font-semibold text-sm">{goal.title}</h3>
                  </div>
                  <div className="ml-8 space-y-2">
                    {goal.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full" />
                        </div>
                        <span className="text-muted-foreground">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-1">
                🎯 Your personalized checklist is ready!
              </p>
              <p className="text-xs text-blue-700">
                We'll show you a step-by-step guide tailored to your goals. 
                You can always skip steps or change your preferences later.
              </p>
            </div>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(0)}
              >
                Back
              </Button>
              <Button 
                onClick={handleComplete}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                Start My Journey
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 