"use client"

import { useState, useEffect } from 'react'
import { BlightstoneLogo } from './BlightstoneLogo'
import { Progress } from '../ui/progress'
import { CheckCircle, Loader2 } from 'lucide-react'

interface LoadingStep {
  id: string
  label: string
  duration: number
  completed: boolean
}

interface DashboardLoadingScreenProps {
  isLoading: boolean
  onComplete?: () => void
}

export function DashboardLoadingScreen({ isLoading, onComplete }: DashboardLoadingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [currentTip, setCurrentTip] = useState(0)
  const [steps, setSteps] = useState<LoadingStep[]>([
    { id: 'auth', label: 'Authenticating...', duration: 500, completed: false },
    { id: 'org', label: 'Loading organization...', duration: 800, completed: false },
    { id: 'data', label: 'Fetching dashboard data...', duration: 1200, completed: false },
    { id: 'assets', label: 'Loading business managers...', duration: 600, completed: false },
    { id: 'preload', label: 'Preparing workspace...', duration: 400, completed: false },
  ])

  const tips = [
    "💡 Use the sidebar to quickly navigate between sections",
    "🚀 Hover over navigation items to preload data instantly",
    "⚡ Business managers and ad accounts are preloaded for speed",
    "🎯 Use the setup guide to complete your onboarding",
    "💰 Check your wallet balance in the top bar",
    "📊 View detailed analytics in each section",
  ]

  // Rotate tips every 2 seconds
  useEffect(() => {
    if (!isLoading) return
    
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % tips.length)
    }, 2000)
    
    return () => clearInterval(tipInterval)
  }, [isLoading, tips.length])

  // ✅ FIXED: Loading sequence with proper cleanup and cancellation
  useEffect(() => {
    if (!isLoading) return

    let stepIndex = 0
    let totalProgress = 0
    const totalSteps = steps.length
    let isActive = true // ✅ Flag to prevent operations after cleanup
    let activeTimeouts = new Set<NodeJS.Timeout>() // ✅ Track all timeouts for cleanup
    let activeIntervals = new Set<NodeJS.Timeout>() // ✅ Track all intervals for cleanup

    const runStep = () => {
      if (!isActive) return // ✅ Exit early if component unmounted
      
      if (stepIndex >= totalSteps) {
        setProgress(100)
        const completionTimeout = setTimeout(() => {
          if (isActive) onComplete?.() // ✅ Only call if still active
        }, 300)
        activeTimeouts.add(completionTimeout)
        return
      }

      const step = steps[stepIndex]
      const stepProgress = (stepIndex / totalSteps) * 100
      
      // Animate progress for this step
      const stepDuration = step.duration
      const progressIncrement = (100 / totalSteps) / (stepDuration / 50)
      
      const progressInterval = setInterval(() => {
        if (!isActive) return // ✅ Exit early if component unmounted
        
        totalProgress += progressIncrement
        const targetProgress = Math.min(totalProgress, stepProgress + (100 / totalSteps))
        setProgress(targetProgress)
        
        if (totalProgress >= stepProgress + (100 / totalSteps)) {
          clearInterval(progressInterval)
          activeIntervals.delete(progressInterval)
          
          if (!isActive) return // ✅ Exit early if component unmounted
          
          // Mark step as completed
          setSteps(prev => prev.map((s, i) => 
            i === stepIndex ? { ...s, completed: true } : s
          ))
          
          stepIndex++
          setCurrentStep(stepIndex)
          
          // ✅ FIXED: Controlled recursive call with cancellation
          const nextStepTimeout = setTimeout(() => {
            if (isActive) runStep() // ✅ Only continue if still active
          }, 100)
          activeTimeouts.add(nextStepTimeout)
        }
      }, 50)
      activeIntervals.add(progressInterval)
    }

    // Start the loading sequence
    const startDelay = setTimeout(runStep, 200)
    activeTimeouts.add(startDelay)
    
    // ✅ FIXED: Comprehensive cleanup that stops all operations
    return () => {
      isActive = false // ✅ Prevent any future operations
      
      // Clear all timeouts
      activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId))
      activeTimeouts.clear()
      
      // Clear all intervals
      activeIntervals.forEach(intervalId => clearInterval(intervalId))
      activeIntervals.clear()
    }
  }, [isLoading, onComplete])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto px-8">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <BlightstoneLogo size="xl" />
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Step */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground">
              {steps[currentStep]?.label || 'Finalizing...'}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {Math.round(progress)}% complete
          </div>
        </div>

        {/* Step List */}
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                index < currentStep
                  ? 'text-foreground opacity-100'
                  : index === currentStep
                  ? 'text-primary opacity-100'
                  : 'text-muted-foreground opacity-50'
              }`}
            >
              <div className="flex-shrink-0">
                {step.completed ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : index === currentStep ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                )}
              </div>
              <span className={step.completed ? 'line-through' : ''}>{step.label}</span>
            </div>
          ))}
        </div>

        {/* Loading Tips */}
        <div className="mt-12 text-center">
          <div className="text-xs text-muted-foreground transition-all duration-500">
            {tips[currentTip]}
          </div>
        </div>
      </div>
    </div>
  )
} 